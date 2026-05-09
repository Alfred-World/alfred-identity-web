'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AuthIllustrationWrapper from '@components/AuthIllustrationWrapper';
import Logo from '@components/layout/shared/Logo';

type ErrorContent = {
  title: string;
  description: string;
  guidance: string;
};

const ERROR_CONTENT: Record<string, ErrorContent> = {
  access_denied: {
    title: 'Access Not Granted',
    description: 'Your account is authenticated, but it cannot access the requested application.',
    guidance: 'Use an account that has access to this application or ask an administrator to update permissions.'
  },
  not_authenticated: {
    title: 'Sign-In Required',
    description: 'You need to sign in before continuing to the requested application.',
    guidance: 'Start a fresh sign-in flow to continue safely.'
  },
  invalid_client: {
    title: 'Application Is Not Available',
    description: 'The target client application is not registered or is currently inactive.',
    guidance: 'Verify the client configuration and application status before trying again.'
  },
  invalid_request: {
    title: 'Authentication Request Failed',
    description: 'The identity request could not be completed.',
    guidance: 'Retry the sign-in flow. If it keeps failing, inspect the request parameters and service configuration.'
  },
  invalid_redirect: {
    title: 'Redirect URL Is Not Allowed',
    description: 'The requested redirect URL is not registered for this application.',
    guidance: 'Ask an administrator to verify the allowed callback URLs for the target application.'
  },
  invalid_redirect_uri: {
    title: 'Redirect URL Is Not Allowed',
    description: 'The requested redirect URL is not registered for this application.',
    guidance: 'Ask an administrator to verify the allowed callback URLs for the target application.'
  },
  session_expired: {
    title: 'Session Expired',
    description: 'Your session has expired. Please sign in again.',
    guidance: 'Start a fresh sign-in flow to continue using the requested application.'
  },
  OAuthSignin: {
    title: 'Unable To Start Sign-In',
    description: 'The sign-in request could not be started for this application.',
    guidance: 'Retry the sign-in flow. If the problem persists, verify the application and gateway configuration.'
  },
  OAuthCallback: {
    title: 'Authentication Callback Failed',
    description: 'The application could not complete the identity provider callback.',
    guidance:
      'Retry the sign-in flow. If the problem persists, verify the application callback URL and browser cookie settings.'
  },
  OAuthCreateAccount: {
    title: 'Account Could Not Be Created',
    description: 'The identity provider returned a profile, but this application could not create the account.',
    guidance: 'Try again or contact an administrator if this account should be allowed to sign in.'
  },
  OAuthAccountNotLinked: {
    title: 'Account Is Already Linked',
    description: 'This email is already linked to another sign-in method.',
    guidance: 'Sign in with the original method for this email address.'
  },
  Callback: {
    title: 'Authentication Callback Failed',
    description: 'The application could not complete the authentication callback.',
    guidance: 'Start a fresh sign-in flow. If it keeps failing, verify the callback configuration.'
  },
  Configuration: {
    title: 'Authentication Is Temporarily Unavailable',
    description: 'The authentication flow is misconfigured for this application.',
    guidance: 'Review the client configuration, issuer settings, and application environment variables.'
  }
};

function normalizeErrorCode(error: string): string {
  if (error === 'AccessDenied') {
    return 'access_denied';
  }

  return error;
}

function getReturnUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('returnUrl') || searchParams.get('redirectTo');
}

function getRequestedApplication(returnUrl: string | null): string | null {
  if (!returnUrl) {
    return null;
  }

  try {
    const isRelativeReturnUrl = returnUrl.startsWith('/');
    const parsed = isRelativeReturnUrl ? new URL(returnUrl, 'https://alfred.local') : new URL(returnUrl);
    const redirectUri = parsed.searchParams.get('redirect_uri');

    if (redirectUri) {
      return new URL(redirectUri).host;
    }

    return parsed.searchParams.get('client_id') || (isRelativeReturnUrl ? 'Alfred Single Sign-On' : parsed.host);
  } catch {
    return returnUrl.startsWith('/') ? 'Alfred Single Sign-On' : returnUrl;
  }
}

function buildLoginHref(returnUrl: string | null): string {
  const params = new URLSearchParams();

  if (returnUrl) {
    params.set('returnUrl', returnUrl);
  }

  const query = params.toString();

  return query ? `/login?${query}` : '/login';
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const searchParamsValue = searchParams.toString();
  const rawError = searchParams.get('error') || searchParams.get('sso_error') || 'invalid_request';
  const error = normalizeErrorCode(rawError);
  const returnUrl = getReturnUrl(searchParams);
  const content = ERROR_CONTENT[error] || ERROR_CONTENT.invalid_request;
  const description =
    searchParams.get('error_description') || searchParams.get('sso_error_description') || content.description;
  const logoutCleared = searchParams.get('logoutCleared') === 'true';
  const loginHref = buildLoginHref(returnUrl);
  const requestedApplication = getRequestedApplication(returnUrl);

  useEffect(() => {
    if (logoutCleared) {
      return;
    }

    const callbackParams = new URLSearchParams(searchParamsValue);

    callbackParams.set('logoutCleared', 'true');

    const callbackUrl = new URL('/auth/error', window.location.origin);

    callbackUrl.search = callbackParams.toString();

    const forceLogoutUrl = new URL('/api/auth/force-logout', window.location.origin);

    forceLogoutUrl.searchParams.set('callbackUrl', callbackUrl.toString());

    window.location.replace(forceLogoutUrl.toString());
  }, [logoutCleared, searchParamsValue]);

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <AuthIllustrationWrapper>
        <Card className='flex flex-col sm:is-[450px]'>
          <CardContent className='sm:!p-12'>
            <Link href='/' className='flex justify-center mbe-6'>
              <Logo />
            </Link>

            <div className='flex flex-col gap-1 mbe-6'>
              <Typography variant='h4'>{content.title}</Typography>
              <Typography>{description}</Typography>
            </div>

            <Alert severity='error' className='mbe-6'>
              {requestedApplication
                ? `Requested application: ${requestedApplication}`
                : 'The authentication request could not be completed.'}
            </Alert>

            <Stack spacing={1} className='mbe-6'>
              <Typography variant='body2' color='text.secondary'>
                {content.guidance}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Error code:{' '}
                <Typography component='span' color='text.primary'>
                  {rawError}
                </Typography>
              </Typography>
            </Stack>

            <Stack spacing={3}>
              <Button fullWidth component={Link} href={loginHref} variant='contained'>
                Back to Login
              </Button>
              <Button fullWidth component={Link} href='/' variant='tonal'>
                Open SSO Home
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </AuthIllustrationWrapper>
    </div>
  );
}
