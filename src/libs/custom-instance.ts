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
export function isApiSuccess<T extends { success: boolean; result?: unknown }>(
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
export function isApiFailure(response: { success: boolean; errors?: unknown } | null | undefined): response is ApiFailure {
  return response?.success === false && Array.isArray(response?.errors);
}

/** Gateway base URL */
export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.test';

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

/**
 * Get authorization headers from NextAuth session.
 * Redirects to login if session is expired.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};

  const session = await getSession();

  if (session?.error === 'RefreshAccessTokenError') {
    window.location.href = '/login?error=session_expired';
    throw new Error('Session expired, redirecting to login');
  }

  if (session?.accessToken) {
    return { Authorization: `Bearer ${session.accessToken}` };
  }

  return {};
}

/**
 * Custom fetch mutator for Orval (pure fetch, no axios).
 *
 * Authentication flow:
 * 1. User logs in via SSO OAuth flow -> NextAuth stores tokens in session
 * 2. Before each request, token is fetched from NextAuth session
 * 3. Token is added to Authorization header
 * 4. On 401, session is refreshed and request is retried once
 *
 * Error handling:
 * - On 2xx: returns parsed JSON body as T
 * - On 4xx/5xx with JSON body: returns error body as T
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
export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const authHeaders = await getAuthHeaders();

  const fullUrl = url.startsWith('http') ? url : `${GATEWAY_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      ...options?.headers,
      ...authHeaders
    }
  });

  // Handle 401: refresh session and retry once
  if (response.status === 401 && typeof window !== 'undefined') {
    await forceRefreshSession();
    const freshAuthHeaders = await getAuthHeaders();

    const retryResponse = await fetch(fullUrl, {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        ...freshAuthHeaders
      }
    });

    if (retryResponse.status === 401) {
      window.location.href = '/login?error=session_expired';
      throw new Error('Session expired, redirecting to login');
    }

    return retryResponse.json() as Promise<T>;
  }

  // For non-2xx responses, still return the JSON body so react-query
  // can use isApiSuccess/isApiFailure for type narrowing
  return response.json() as Promise<T>;
};

// Error type for react-query
export type ErrorType<Error> = Error;

export default customFetch;
