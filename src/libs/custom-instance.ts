import { signOut } from 'next-auth/react';

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

/**
 * Gateway base URL (public, build-time inlined).
 * Used for browser redirect URLs (SSO check, logout, etc.) — NOT for API calls.
 * API calls go through the BFF proxy at /api/gateway/[...path].
 */
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

  try {
    await signOut({ redirect: false });
  } catch (_e) {
    // signOut failure is non-critical, continue with redirect
  }

  window.location.href = '/login?error=session_expired';

  return new Promise<never>(() => { });
}

/**
 * Custom fetch mutator for Orval — BFF Proxy pattern.
 *
 * Authentication flow (2 legs):
 *   Leg 1: Browser → Next.js proxy — HttpOnly session cookie (automatic, anti-XSS)
 *   Leg 2: Next.js proxy → Gateway — JWT Authorization header (server-side only)
 *
 * The browser NEVER sees the JWT access token. It is kept inside the
 * encrypted NextAuth session cookie (HttpOnly, Secure).
 *
 * The proxy handles token refresh server-side. If the proxy returns 401,
 * the token is truly invalid (refresh also failed) — redirect to login.
 *
 * @example
 * const { data } = useGetRoles()
 * if (isApiSuccess(data)) {
 *   console.log(data.result?.items)
 * }
 */
export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  // Server-side (NextAuth callbacks, SSR): call gateway directly — no proxy needed
  if (typeof window === 'undefined') {
    const serverGatewayUrl = process.env.INTERNAL_GATEWAY_URL || GATEWAY_URL;
    const fullUrl = url.startsWith('http') ? url : `${serverGatewayUrl}${url}`;

    const response = await fetch(fullUrl, { ...options });

    return response.json() as Promise<T>;
  }

  if (isRedirectingToLogin) {
    return new Promise<never>(() => { });
  }

  // Client-side: route through BFF proxy — converts /identity/users → /api/gateway/identity/users
  const proxyUrl = url.startsWith('http') ? url : `/api/gateway${url}`;

  const response = await fetch(proxyUrl, {
    ...options,
    credentials: 'include', // Sends HttpOnly session cookie automatically
  });

  // The proxy already handles token refresh server-side.
  // If we still get 401, it means the session is truly expired.
  if (response.status === 401) {
    // Auth endpoints (login, token) use 401 for invalid credentials — not session expiry.
    // Return the response body so the UI can display the actual error.
    const isAuthEndpoint = url.includes('/auth/sso-login') || url.includes('/auth/token');

    if (isAuthEndpoint) {
      return response.json() as Promise<T>;
    }

    // Check if the response body indicates a permission error (vs session expired)
    const body = await response.json() as T;
    const apiBody = body as { errors?: Array<{ code?: string }> };
    const isPermissionError = apiBody.errors?.some(e => e.code !== 'UNAUTHORIZED');

    if (isPermissionError) {
      return body;
    }

    return redirectToLogin();
  }

  // For all responses (including 4xx/5xx), return JSON body
  // so react-query can use isApiSuccess/isApiFailure for type narrowing
  return response.json() as Promise<T>;
};

// Error type for react-query
export type ErrorType<Error> = Error;

export default customFetch;
