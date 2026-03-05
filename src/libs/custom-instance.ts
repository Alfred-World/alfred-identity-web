import { getSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

import { NEXT_PUBLIC_GATEWAY_URL } from './env';

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

/** Gateway base URL — validated at build time via env.ts */
export const GATEWAY_URL = NEXT_PUBLIC_GATEWAY_URL;

// ============================================================
// Global redirect guard — prevents multiple redirect attempts
// and keeps react-query in "loading" state during navigation
// ============================================================
let isRedirectingToLogin = false;

/**
 * Redirect to login and return a never-resolving promise.
 * This keeps react-query in a "loading" state so AuthGuard/AuthRedirect
 * won't fire while the browser is navigating away.
 */
async function redirectToLogin(): Promise<never> {
  if (isRedirectingToLogin) {
    return new Promise<never>(() => { });
  }

  isRedirectingToLogin = true;

  // Clear the NextAuth session cookie first, otherwise GuestOnlyRoute
  // will see a valid session and redirect back to /dashboards (infinite loop)
  try {
    await signOut({ redirect: false });
  } catch (_e) {
    // signOut failure is non-critical, continue with redirect
  }

  window.location.href = '/login?error=session_expired';
  
return new Promise<never>(() => { });
}

// ============================================================
// Session cache — avoid calling getSession() on every API call
// ============================================================
const SESSION_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let cachedSession: Session | null = null;
let sessionFetchedAt = 0;
let sessionFetchPromise: Promise<Session | null> | null = null;

/**
 * Invalidate the cached session so next API call re-fetches it.
 */
function invalidateSessionCache() {
  cachedSession = null;
  sessionFetchedAt = 0;
  sessionFetchPromise = null;
}

/**
 * Get the NextAuth session, with in-memory caching.
 * - Returns cached session if still fresh (< SESSION_CACHE_TTL_MS)
 * - Deduplicates concurrent calls (single in-flight request)
 */
async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedSession && now - sessionFetchedAt < SESSION_CACHE_TTL_MS) {
    return cachedSession;
  }

  // Deduplicate: if a fetch is already in-flight, wait for it
  if (sessionFetchPromise) {
    return sessionFetchPromise;
  }

  sessionFetchPromise = getSession()
    .then(session => {
      cachedSession = session;
      sessionFetchedAt = Date.now();
      
return session;
    })
    .finally(() => {
      sessionFetchPromise = null;
    });

  return sessionFetchPromise;
}

/**
 * Get authorization headers from NextAuth session (cached).
 * Redirects to login if session has a permanent error.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};

  const session = await getCachedSession();

  if (session?.error === 'RefreshAccessTokenError') {
    console.error('[customFetch] ❌ Session has RefreshAccessTokenError');
    
return redirectToLogin() as never;
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
 * 2. Before each request, token is fetched from NextAuth session (cached 2 min)
 * 3. Token is added to Authorization header
 * 4. On 401, session cache is busted, session is re-fetched, and request retried once
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
  // If we're already redirecting to login, don't make any more API calls
  if (isRedirectingToLogin) {
    return new Promise<never>(() => { });
  }

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

  // Handle 401: bust cache, re-fetch session, retry once
  if (response.status === 401 && typeof window !== 'undefined') {
    // Bust the cache so we get a fresh session (which triggers JWT callback → token refresh)
    invalidateSessionCache();

    const freshAuthHeaders = await getAuthHeaders();
    const hasValidToken = 'Authorization' in freshAuthHeaders;

    const retryResponse = await fetch(fullUrl, {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        ...freshAuthHeaders
      }
    });

    if (retryResponse.status === 401) {
      // Differentiate: if we have a valid token but still get 401,
      // it's an application-level 401 (e.g. permission denied, endpoint-specific).
      // Return the response body as ApiFailure for the component to handle.
      // Only redirect to login if the session itself is invalid (no token).
      if (hasValidToken) {
        return retryResponse.json() as Promise<T>;
      }

      // No valid token after refresh → session is truly expired
      return redirectToLogin();
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
