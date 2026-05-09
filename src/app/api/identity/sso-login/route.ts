import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SsoLoginRequest, SsoLoginResponseApiResponse } from '@/generated/identity-api';

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const SERVER_GATEWAY_URL = process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL!;

function buildFallbackApiFailure(status: number): SsoLoginResponseApiResponse {
  if (status === 401) {
    const message = 'Invalid username or password.';

    return { success: false, message, errors: [{ message, code: 'UNAUTHORIZED' }] };
  }

  if (status === 403) {
    const message = 'You do not have permission to sign in.';

    return { success: false, message, errors: [{ message, code: 'FORBIDDEN' }] };
  }

  if (status === 502 || status === 503 || status === 504) {
    const message = 'Authentication service is unavailable.';

    return { success: false, message, errors: [{ message, code: 'AUTH_SERVICE_UNAVAILABLE' }] };
  }

  const message = 'Login failed. Please try again.';

  return { success: false, message, errors: [{ message, code: 'REQUEST_FAILED' }] };
}

function errorResponse(message: string, code: string, status: number) {
  const body: SsoLoginResponseApiResponse = { success: false, message, errors: [{ message, code }] };

  return NextResponse.json(body, { status });
}

async function parseUpstreamResponse(upstream: Response): Promise<SsoLoginResponseApiResponse> {
  const rawBody = await upstream.text();
  const trimmedBody = rawBody.trim();

  if (trimmedBody.length === 0) {
    return buildFallbackApiFailure(upstream.ok ? 502 : upstream.status);
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  const looksLikeJson =
    contentType.includes('application/json') ||
    contentType.includes('+json') ||
    trimmedBody.startsWith('{') ||
    trimmedBody.startsWith('[');

  if (!looksLikeJson) {
    return buildFallbackApiFailure(upstream.ok ? 502 : upstream.status);
  }

  try {
    return JSON.parse(trimmedBody) as SsoLoginResponseApiResponse;
  } catch {
    return buildFallbackApiFailure(upstream.ok ? 502 : upstream.status);
  }
}

export async function POST(request: NextRequest) {
  let payload: SsoLoginRequest;

  try {
    payload = (await request.json()) as SsoLoginRequest;
  } catch {
    return errorResponse('Invalid request body.', 'INVALID_REQUEST', 400);
  }

  try {
    const upstream = await fetch(`${SERVER_GATEWAY_URL}/identity/v1/auth/sso-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Host': request.headers.get('host') || '',
        'X-Forwarded-Proto': request.headers.get('x-forwarded-proto') || 'https',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        'User-Agent': request.headers.get('user-agent') || 'identity-web'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const body = await parseUpstreamResponse(upstream);

    return NextResponse.json(body, { status: upstream.ok && body.success === false ? 502 : upstream.status });
  } catch {
    return errorResponse('Authentication service is unavailable.', 'AUTH_SERVICE_UNAVAILABLE', 502);
  }
}
