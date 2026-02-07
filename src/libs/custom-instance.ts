import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios, { isCancel } from 'axios';
import { getSession } from 'next-auth/react';

// ============================================================
// Discriminated Union Types for API Responses
// ============================================================
// Backend sends unified response shape:
//   Success: { success: true, result: T, message?: string }
//   Error:   { success: false, errors: [{ message, code }] }
//
// Usage:
//   const { data } = useDeleteRolesId(...)
//   if (isApiSuccess(data)) {
//     data.result  // TS narrows to T (non-null)
//   } else {
//     data.errors  // TS narrows to ApiError[]
//   }
// ============================================================

export interface ApiError {
  message: string;
  code: string;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  result: T;
}

export interface ApiFailure {
  success: false;
  errors: ApiError[];
}

/**
 * Discriminated union type for API responses.
 * Use isApiSuccess() / isApiFailure() type guards for narrowing.
 */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/**
 * Type guard: narrows to success response with result.
 *
 * @example
 * if (isApiSuccess(data)) {
 *   console.log(data.result.name);  // TS knows result is non-null
 * }
 */
export function isApiSuccess<T extends { success: boolean; result?: any }>(
  response: T | null | undefined
): response is T & { success: true; result: NonNullable<T['result']> } {
  return response?.success === true;
}

/**
 * Type guard: narrows to failure response with errors array.
 *
 * @example
 * if (isApiFailure(data)) {
 *   data.errors.forEach(e => toast.error(e.message));
 * }
 */
export function isApiFailure(response: { success: boolean; errors?: any } | null | undefined): response is ApiFailure {
  return response?.success === false && Array.isArray(response?.errors);
}

/**
 * Axios instance with base configuration
 *
 * Authentication flow:
 * 1. User logs in via SSO OAuth flow -> NextAuth stores tokens in session
 * 2. Request interceptor gets token from NextAuth session
 * 3. Token is added to Authorization header for API calls
 * 4. Token refresh is handled automatically by NextAuth
 */
export const AXIOS_INSTANCE = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  withCredentials: true, // Send cookies with requests
  paramsSerializer: params => {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }
});

// Track if we're currently refreshing the session
let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;

/**
 * Force refresh the NextAuth session to get new tokens
 */
async function forceRefreshSession() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include'
  }).finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

// Request interceptor to add Authorization header
AXIOS_INSTANCE.interceptors.request.use(async config => {
  // Only run on client side
  if (typeof window !== 'undefined') {
    // Force fresh session to trigger token refresh if needed
    const session = await getSession();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    // Check if session has error (token refresh failed)
    if (session?.error === 'RefreshAccessTokenError') {
      // Session is invalid, redirect to login
      window.location.href = '/login?error=session_expired';
      throw isCancel('Session expired, redirecting to login');
    }
  }

  return config;
});

// Response interceptor to handle 401 and retry with refreshed token
AXIOS_INSTANCE.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't retried yet, try to refresh session
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;

      // Force refresh the session
      await forceRefreshSession();

      // Get fresh session
      const session = await getSession();

      if (session?.accessToken) {
        // Retry with new token
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${session.accessToken}`
        };

        return AXIOS_INSTANCE(originalRequest);
      }

      // Still no token after refresh, redirect to login
      window.location.href = '/login?error=session_expired';
      throw isCancel('Session expired, redirecting to login');
    }

    return Promise.reject(error);
  }
);

/**
 * Custom Axios instance for Orval.
 *
 * - On 2xx: returns response body as T
 * - On 4xx/5xx: catches axios error, returns error response body as T
 *   (which has { success: false, errors: [...] })
 * - On network error (no response): re-throws
 *
 * This means ALL API responses flow through onSuccess/data in react-query,
 * and you can use isApiSuccess(data) / isApiFailure(data) to narrow:
 *
 * @example
 * const { data } = useGetRoles()
 * if (isApiSuccess(data)) {
 *   console.log(data.result?.items)
 * }
 *
 * @example
 * const { mutate } = useDeleteRolesId({
 *   mutation: {
 *     onSuccess: (data) => {
 *       if (isApiSuccess(data)) {
 *         toast.success('Deleted!')
 *       } else if (isApiFailure(data)) {
 *         data.errors.forEach(e => toast.error(e.message))
 *       }
 *     }
 *   }
 * })
 */
export const customInstance = <T>(url: string, options?: RequestInit): Promise<T> => {
   
  const source = axios.CancelToken.source();

  // Convert RequestInit headers to plain object for Axios
  let headers: Record<string, string> | undefined;

  if (options?.headers) {
    if (options.headers instanceof Headers) {
      headers = {};
      options.headers.forEach((value, key) => {
        headers![key] = value;
      });
    } else {
      headers = { ...options.headers } as Record<string, string>;
    }
  }

  // Convert RequestInit options to AxiosRequestConfig
  const axiosConfig: AxiosRequestConfig = {
    url,
    method: (options?.method as any) || 'GET',
    headers,
    data: options?.body,
    cancelToken: source.token
  };

  const promise = AXIOS_INSTANCE(axiosConfig)
    .then(({ data }) => data as T)
    .catch((error: AxiosError) => {
      // If server responded with error body (4xx/5xx), return it as T
      // This allows checking data.success / data.errors in onSuccess
      if (error.response?.data) {
        return error.response.data as T;
      }

      // Network errors (no response) still throw
      throw error;
    });

  // @ts-expect-error adding cancel method to promise
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

// Override the return error type so react-query sees AxiosError
export type ErrorType<Error> = AxiosError<Error>;

export default customInstance;
