'use client';

// React Imports
import { useState, useEffect, useRef } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';

// Third-party Imports
import { signIn } from 'next-auth/react';
import { Controller, useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { email, object, minLength, string, pipe, nonEmpty } from 'valibot';
import type { SubmitHandler } from 'react-hook-form';
import type { InferInput } from 'valibot';

// Type Imports
import type { SystemMode } from '@core/types';

// Component Imports
import AuthIllustrationWrapper from '@components/AuthIllustrationWrapper';
import CustomTextField from '@core/components/mui/TextField';
import Loading from '@components/Loading';
import Logo from '@components/layout/shared/Logo';

// Config Imports
import themeConfig from '@configs/themeConfig';

// SSO Imports
import { validateSsoToken } from '@/libs/sso-config';
import { postIdentityAuthSsoLogin } from '@/generated';

type ErrorType = {
  message: string[];
};

type FormData = InferInput<typeof schema>;

const schema = object({
  email: pipe(string(), minLength(1, 'This field is required'), email('Email is invalid')),
  password: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(5, 'Password must be at least 5 characters long')
  )
});

const Login = ({ mode: _mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const ssoCheckRef = useRef(false);
  const [errorState, setErrorState] = useState<ErrorType | null>(null);

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: 'admin@gmail.com',
      password: 'Admin@123'
    }
  });

  // Handle SSO token from redirect flow (from AuthRedirect -> check-sso -> back here)
  // Also handle start_oauth param to trigger OAuth flow after SSO login
  useEffect(() => {
    if (ssoCheckRef.current) return;
    ssoCheckRef.current = true;

    const handleSsoToken = async () => {
      const ssoToken = searchParams.get('sso_token');
      const ssoError = searchParams.get('sso_error');
      const startOAuth = searchParams.get('start_oauth');
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboards';
      const redirectTo = searchParams.get('redirectTo') || '/dashboards';

      // If start_oauth=true, trigger OAuth flow to get access tokens
      // This happens after SSO login sets the cookie
      if (startOAuth === 'true') {
        // Call signIn with sso-oauth provider - this will redirect to Gateway
        // Gateway will see SSO cookie and auto-approve, returning with tokens
        signIn('sso-oauth', { callbackUrl });

        return;
      }

      // If SSO check returned error, just show login form
      if (ssoError) {
        setIsCheckingSso(false);

        return;
      }

      // If we have an SSO token, exchange it for session
      if (ssoToken) {
        try {
          // Use generated API function via sso-config for type safety
          const response = await validateSsoToken(ssoToken);

          if (response.success && response.result) {
            // Sign in using SSO session
            const user = response.result as { userId: string; email: string; fullName?: string; userName?: string };

            const result = await signIn('sso-session', {
              redirect: false,
              userId: user.userId.toString(),
              email: user.email,
              name: user.fullName || user.userName || user.email
            });

            if (result?.ok) {
              router.replace(redirectTo);

              return;
            }
          }
        } catch {
          // SSO token exchange failed, show login form
        }
      }

      setIsCheckingSso(false);
    };

    handleSsoToken();
  }, [router, searchParams]);

  const handleClickShowPassword = () => setIsPasswordShown(show => !show);

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    try {
      // Build return URL that will trigger OAuth after SSO cookie is set
      const ssoAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sso.test';
      const finalDestination = searchParams.get('returnUrl') || '/dashboards';

      // After exchange-token, redirect to login with start_oauth=true
      // This will trigger signIn('sso-oauth') to complete the OAuth flow
      const returnUrl = `${ssoAppUrl}/login?start_oauth=true&callbackUrl=${encodeURIComponent(finalDestination)}`;

      const response = await postIdentityAuthSsoLogin({
        identity: data.email,
        password: data.password,
        rememberMe: true,
        returnUrl: returnUrl
      });

      if (!response.success || !response.result) {
        setErrorState({ message: [response.message || 'Login failed'] });

        return;
      }

      const { returnUrl: exchangeUrl } = response.result;

      if (exchangeUrl) {
        // Navigate to Gateway exchange-token to set SSO cookie
        // After that, will redirect back with start_oauth=true
        window.location.href = exchangeUrl;
      } else {
        setErrorState({ message: ['Exchange URL not received'] });
      }
    } catch (e: unknown) {
      setErrorState({ message: [e instanceof Error ? e.message : 'Login failed'] });
    }
  };

  // Show loading while checking SSO session
  if (isCheckingSso) {
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
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign-in to your account and start the adventure</Typography>
          </div>
          <form
            noValidate
            autoComplete='off'
            action={() => { }}
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-6'
          >
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  type='email'
                  label='Email'
                  placeholder='Enter your email'
                  onChange={e => {
                    field.onChange(e.target.value);
                    errorState !== null && setErrorState(null);
                  }}
                  {...((errors.email || errorState !== null) && {
                    error: true,
                    helperText: errors?.email?.message || errorState?.message[0]
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
                  onChange={e => {
                    field.onChange(e.target.value);
                    errorState !== null && setErrorState(null);
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='Remember me' />
              <Typography className='text-end' color='primary.main' component={Link} href='/forgot-password'>
                Forgot password?
              </Typography>
            </div>
            <Button fullWidth variant='contained' type='submit'>
              Login
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>New on our platform?</Typography>
              <Typography component={Link} href='/register' color='primary.main'>
                Create an account
              </Typography>
            </div>
            <Divider className='gap-2 text-textPrimary'>or</Divider>
            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'>
                <i className='tabler-brand-facebook-filled' />
              </IconButton>
              <IconButton className='text-twitter' size='small'>
                <i className='tabler-brand-twitter-filled' />
              </IconButton>
              <IconButton className='text-textPrimary' size='small'>
                <i className='tabler-brand-github-filled' />
              </IconButton>
              <IconButton className='text-error' size='small' onClick={() => signIn('google')}>
                <i className='tabler-brand-google-filled' />
              </IconButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  );
};

export default Login;
