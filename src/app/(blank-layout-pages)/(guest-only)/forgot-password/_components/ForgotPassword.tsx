'use client';

// React Imports
import { useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// Third-party Imports
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { email, object, pipe, string, minLength } from 'valibot';
import type { SubmitHandler, FieldValues } from 'react-hook-form';
import type { InferInput } from 'valibot';

// Type Imports
import type { SystemMode } from '@core/types';

// Component Imports
import CustomTextField from '@core/components/mui/TextField';
import DirectionalIcon from '@components/DirectionalIcon';
import Logo from '@components/layout/shared/Logo';

// Generated API Imports
import { usePostIdentityAuthForgotPassword } from '@/generated/identity-api';
import AuthIllustrationWrapper from '@/components/AuthIllustrationWrapper';

// Validation schema
const schema = object({
  email: pipe(
    string(),
    minLength(1, 'Email is required'),
    email('Please enter a valid email address')
  )
});

type FormData = InferInput<typeof schema>;

const ForgotPassword = ({ mode: _mode }: { mode: SystemMode }) => {
  // States
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: ''
    }
  });

  const { mutateAsync: forgotPassword } = usePostIdentityAuthForgotPassword();

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await forgotPassword({
        data: data as FormData
      });

      setSuccessMessage('If an account exists with that email, you will receive password reset instructions shortly.');

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthIllustrationWrapper>
      <div className='relative'>
        <Card className='flex flex-col sm:is-[450px] z-[1] relative'>
          <CardContent className='sm:!p-12'>
            <Link href='/' className='flex justify-center mbe-6'>
              <Logo />
            </Link>
            <div className='flex flex-col gap-1 mbe-6'>
              <Typography variant='h4'>Forgot Password? 🔒</Typography>
              <Typography color='textSecondary'>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Typography>
            </div>

            {successMessage && (
              <Alert severity='success' className='mbe-4'>{successMessage}</Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
              <Controller
                name='email'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    autoFocus
                    fullWidth
                    label='Email'
                    placeholder='Enter your email'
                    type='email'
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
              <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;

