'use client';

import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

type ApiLikeError = {
  status?: number;
  errors?: Array<{ code?: string }>;
};

const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const apiError = error as ApiLikeError | undefined;

  if (typeof apiError?.status === 'number' && apiError.status >= 400 && apiError.status < 500) {
    return false;
  }

  const errorCode = apiError?.errors?.[0]?.code?.toUpperCase();

  if (errorCode === 'FORBIDDEN' || errorCode === 'UNAUTHORIZED') {
    return false;
  }

  return failureCount < 3;
};

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Old data considered fresh for 1 minute
            refetchOnWindowFocus: false, // Disable automatic refetching when switching tabs
            retry: shouldRetryQuery
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
