'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Auto-signout page - redirects to server-side logout API
 * This ensures cookies are properly deleted before redirecting
 */
export default function SignoutPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/login';

  useEffect(() => {
    // Redirect to server-side logout API which handles cookie deletion
    const logoutUrl = `/api/auth/logout?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    window.location.href = logoutUrl;
  }, [callbackUrl]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={48} />
      <Typography variant='body1' color='text.secondary'>
        Signing out...
      </Typography>
    </Box>
  );
}
