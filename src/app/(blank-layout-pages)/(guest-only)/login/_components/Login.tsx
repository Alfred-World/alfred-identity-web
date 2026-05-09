'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';

import { signIn, signOut } from 'next-auth/react';
import { Controller, useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { boolean, object, minLength, string, pipe, nonEmpty } from 'valibot';
import type { SubmitHandler } from 'react-hook-form';
import type { InferInput } from 'valibot';

import type { SystemMode } from '@core/types';

import AuthIllustrationWrapper from '@components/AuthIllustrationWrapper';
import CustomTextField from '@core/components/mui/TextField';
import Loading from '@components/Loading';
import Logo from '@components/layout/shared/Logo';

import themeConfig from '@configs/themeConfig';

import { NEXT_PUBLIC_APP_URL } from '@/libs/env';
import type { SsoLoginResponseApiResponse } from '@/generated/identity-api';

type FormData = InferInput<typeof schema>;

const LOGIN_RETURN_URL_STORAGE_KEY = 'identity_login_return_url';

const NEXTAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'The sign-in request could not be started. Please try again.',
  OAuthCallback: 'The application could not complete the authentication callback. Please try again.',
  OAuthCreateAccount: 'Could not create your account from the identity provider.',
  OAuthAccountNotLinked: 'This email is already linked to another sign-in method.',
  Callback: 'Authentication callback failed. Please try again.',
  AccessDenied: 'Access denied.',
  access_denied: 'Access denied.',
  invalid_client: 'Client application is not registered or inactive.',
  invalid_request: 'Authentication request is invalid.',
  session_expired: 'Your session has expired. Please sign in again.',
  Configuration: 'Authentication is temporarily unavailable for this application.',
  Default: 'Authentication failed. Please try again.'
};

const schema = object({
  identity: pipe(string(), nonEmpty('This field is required')),
  password: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(5, 'Password must be at least 5 characters long')
  ),
  rememberMe: boolean()
});

function isGatewayAuthorizeUrl(url: string) {
  return url.includes('/connect/authorize');
}

function buildErrorUrl(searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());

  if (!params.has('error') && params.has('sso_error')) {
    params.set('error', params.get('sso_error') || 'invalid_request');
  }

  if (!params.has('error_description') && params.has('sso_error_description')) {
    params.set('error_description', params.get('sso_error_description') || 'Authentication failed.');
  }

  if (!params.has('returnUrl')) {
    params.set('returnUrl', searchParams.get('returnUrl') || searchParams.get('callbackUrl') || '/dashboards');
  }

  return `/auth/error?${params.toString()}`;
}

const Login = ({ mode: _mode }: { mode: SystemMode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const didBootstrapRef = useRef(false);

  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      identity: '',
      password: '',
      rememberMe: true
    }
  });

  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    const bootstrap = async () => {
      const authError = searchParams.get('error') || searchParams.get('sso_error');

      if (authError) {
        await signOut({ redirect: false });
        sessionStorage.removeItem(LOGIN_RETURN_URL_STORAGE_KEY);
        window.location.replace(buildErrorUrl(new URLSearchParams(searchParams.toString())));

        return;
      }

      const queryReturnUrl = searchParams.get('returnUrl');

      if (queryReturnUrl) {
        sessionStorage.setItem(LOGIN_RETURN_URL_STORAGE_KEY, queryReturnUrl);
      }

      const callbackUrl =
        searchParams.get('callbackUrl') ||
        queryReturnUrl ||
        searchParams.get('redirectTo') ||
        sessionStorage.getItem(LOGIN_RETURN_URL_STORAGE_KEY) ||
        '/dashboards';

      if (searchParams.get('start_oauth') === 'true') {
        if (isGatewayAuthorizeUrl(callbackUrl)) {
          sessionStorage.removeItem(LOGIN_RETURN_URL_STORAGE_KEY);
          window.location.href = callbackUrl;

          return;
        }

        sessionStorage.setItem(LOGIN_RETURN_URL_STORAGE_KEY, callbackUrl);
        signIn('sso-oauth', { callbackUrl });

        return;
      }

      setIsChecking(false);
    };

    void bootstrap();
  }, [searchParams]);

  const handleClickShowPassword = () => setIsPasswordShown(show => !show);

  const onSubmit: SubmitHandler<FormData> = async data => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const finalDestination =
        searchParams.get('returnUrl') || sessionStorage.getItem(LOGIN_RETURN_URL_STORAGE_KEY) || '/dashboards';

      sessionStorage.setItem(LOGIN_RETURN_URL_STORAGE_KEY, finalDestination);

      const returnUrl = isGatewayAuthorizeUrl(finalDestination)
        ? finalDestination
        : `${NEXT_PUBLIC_APP_URL}/login?start_oauth=true&callbackUrl=${encodeURIComponent(finalDestination)}`;

      const response = await fetch('/api/identity/sso-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: data.identity,
          password: data.password,
          rememberMe: data.rememberMe,
          returnUrl
        })
      });

      const body = (await response.json()) as SsoLoginResponseApiResponse;

      if (!response.ok || !body.success || !body.result?.returnUrl) {
        setErrorMessage(body.errors?.[0]?.message || body.message || 'Login failed. Please try again.');

        return;
      }

      window.location.href = body.result.returnUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return <Loading className='bs-full min-bs-[100dvh]' />;
  }

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href='/' className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}!`}</Typography>
            <Typography>Please sign in to your account</Typography>
          </div>
          {errorMessage && (
            <Alert severity='error' className='mbe-6' onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='identity'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Email or Username'
                  placeholder='Enter your email or username'
                  onChange={event => {
                    field.onChange(event.target.value);
                    setErrorMessage(null);
                  }}
                  {...(errors.identity && {
                    error: true,
                    helperText: errors.identity.message
                  })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  id='login-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  onChange={event => {
                    field.onChange(event.target.value);
                    setErrorMessage(null);
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={event => event.preventDefault()}>
                            <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && {
                    error: true,
                    helperText: errors.password.message
                  })}
                />
              )}
            />
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <Controller
                name='rememberMe'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value ?? false}
                        onBlur={field.onBlur}
                        onChange={(_, checked) => field.onChange(checked)}
                        inputRef={field.ref}
                      />
                    }
                    label='Remember me'
                  />
                )}
              />
              <Typography className='text-end' color='primary.main' component={Link} href='/forgot-password'>
                Forgot password?
              </Typography>
            </div>
            <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
              Login
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>New on our platform?</Typography>
              <Typography component={Link} href='/register' color='primary.main'>
                Create an account
              </Typography>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  );
};

export default Login;
