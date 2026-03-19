'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { signOut } from 'next-auth/react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const ERROR_MAP: Record<string, string> = {
  invalid_client: 'Client application is not registered or inactive.',
  invalid_request: 'The authentication request is invalid.',
  invalid_redirect: 'Redirect URL is not allowed.'
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'invalid_request';
  const description = searchParams.get('error_description') || ERROR_MAP[error] || 'Authentication failed.';

  useEffect(() => {
    void signOut({ redirect: false });
  }, []);

  return (
    <div className='flex min-h-screen items-center justify-center p-6'>
      <Card className='w-full max-w-xl'>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant='h5'>Authentication Failed</Typography>
            <Typography variant='body2' color='text.secondary'>
              {description}
            </Typography>
            <Stack direction='row' spacing={2}>
              <Button component={Link} href='/login' variant='contained'>
                Back to Login
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
}
