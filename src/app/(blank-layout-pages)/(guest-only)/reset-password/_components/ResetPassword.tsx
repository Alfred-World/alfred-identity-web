'use client';

// React Imports
import { useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

// Third-party Imports
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { object, pipe, string, minLength } from 'valibot';
import type { SubmitHandler, FieldValues } from 'react-hook-form';
import type { InferInput } from 'valibot';

// Type Imports
import type { SystemMode } from '@core/types';

// Component Imports
import AuthIllustrationWrapper from '@components/AuthIllustrationWrapper';
import CustomTextField from '@core/components/mui/TextField';
import DirectionalIcon from '@components/DirectionalIcon';
import Logo from '@components/layout/shared/Logo';

// Generated API Imports
import { usePostIdentityAuthResetPassword } from '@/generated/identity-api';

// Validation schema
const schema = object({
  newPassword: pipe(
    string(),
    minLength(8, 'Password must be at least 8 characters long')
  ),
  confirmPassword: pipe(
    string(),
    minLength(1, 'Confirm password is required')
  )
});

type FormData = InferInput<typeof schema>;

const ResetPassword = ({ mode: _mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { mutateAsync: resetPassword } = usePostIdentityAuthResetPassword();

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    // Check if passwords match
    if (data.newPassword !== data.confirmPassword) {
      setErrorMessage('Passwords do not match');

      return;
    }

    if (!token || !email) {
      setErrorMessage('Invalid reset link. Please request a new one.');

      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await resetPassword({
        data: {
          email,
          token,
          newPassword: data.newPassword
        }
      });

      if (res.success) {
        // Show success message and redirect
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 2000);
      } else {
        setErrorMessage(res.errors?.[0]?.message || 'Failed to reset password');
      }
    }
    catch (error) {
      console.error('Error resetting password:', (error as Error).message);
      setErrorMessage((error as Error).message);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // Check if token and email are present
  if (!token || !email) {
    return (
      <AuthIllustrationWrapper>
        <Card className='flex flex-col sm:is-[450px] z-[1] relative'>
          <CardContent className='sm:!p-12'>
            <Link href='/' className='flex justify-center mbe-6'>
              <Logo />
            </Link>
            <Alert severity='error' className='mb-6'>
              Invalid reset link. Please request a new password reset.
            </Alert>
            <Button fullWidth variant='contained' href='/forgot-password'>
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </AuthIllustrationWrapper>
    );
  }

  return (
    <AuthIllustrationWrapper>
      <div className='relative'>
        <div className='absolute inset-0 rounded-xl bg-backgroundPaper opacity-70 -translate-x-2.5 -translate-y-2.5' />
        <div className='absolute inset-0 rounded-xl bg-backgroundPaper opacity-40 -translate-x-5 -translate-y-5' />
        <Card className='flex flex-col sm:is-[450px] z-[1] relative'>
          <CardContent className='sm:!p-12'>
            <Link href='/' className='flex justify-center mbe-6'>
              <Logo />
            </Link>
            <div className='flex flex-col gap-1 mbe-6'>
              <Typography variant='h4'>Reset Password 🔒</Typography>
              <Typography>Your new password must be different from previously used passwords</Typography>
            </div>

            {errorMessage && (
              <Alert severity='error' className='mbe-4'>{errorMessage}</Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
              <Controller
                name='newPassword'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    autoFocus
                    fullWidth
                    label='New Password'
                    placeholder='············'
                    type={isPasswordShown ? 'text' : 'password'}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsPasswordShown(!isPasswordShown)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    error={Boolean(errors.newPassword)}
                    helperText={errors.newPassword?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
              <Controller
                name='confirmPassword'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Confirm Password'
                    placeholder='············'
                    type={isConfirmPasswordShown ? 'text' : 'password'}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
              <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Set New Password'}
              </Button>
              <Typography className='flex justify-center items-center' color='primary.main'>
                <DirectionalIcon
                  ltrIconClass='tabler-chevron-left'
                  rtlIconClass='tabler-chevron-right'
                  className='text-xl'
                />
                <Link href='/login' className='text-primary font-medium'>
                  Back to Login
                </Link>
              </Typography>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthIllustrationWrapper>
  );
};

export default ResetPassword;
