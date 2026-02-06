'use client';

import { use } from 'react';

import { useRouter } from 'next/navigation';

import { Box, Typography, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

import { useGetApplicationsId, usePutApplicationsId, type UpdateApplicationRequest } from '@/generated';
import { ApplicationForm, type ApplicationFormSubmitData } from '../_components/ApplicationForm';
import { isApiFailure } from '@/libs/custom-instance';
import { ROUTES } from '@/configs/routes';

export default function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const { data: applicationData, isLoading: isFetching } = useGetApplicationsId(id);

  const { mutate: updateApplication, isPending: isUpdating } = usePutApplicationsId({
    mutation: {
      onSuccess: data => {
        if (data?.success) {
          toast.success('Application updated successfully');
          router.push(ROUTES.APPLICATIONS.LIST);
        } else if (isApiFailure(data)) {
          data.errors.forEach(err => toast.error(err.message));
        } else {
          toast.error(data?.message || 'Failed to update application');
        }
      }
    }
  });

  if (isFetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Safely access properties by checking success
  const result = applicationData?.success ? applicationData.result : null;

  if (!result) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color='error'>Application not found or failed to load.</Typography>
      </Box>
    );
  }

  const handleSubmit = (data: ApplicationFormSubmitData) => {
    const payload: UpdateApplicationRequest = {
      displayName: data.displayName,
      redirectUris: data.redirectUris,
      postLogoutRedirectUris: data.postLogoutRedirectUris || null,
      permissions: data.permissions || null
    };

    updateApplication({ id, data: payload });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <ApplicationForm initialData={result} isEdit={true} isLoading={isUpdating} onSubmit={handleSubmit} />
    </Box>
  );
}
