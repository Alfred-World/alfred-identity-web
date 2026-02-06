'use client';

import { useRouter } from 'next/navigation';

import { Box } from '@mui/material';
import { toast } from 'react-toastify';

import { usePostApplications, type CreateApplicationRequest, type ApplicationDto } from '@/generated';
import { ApplicationForm, type ApplicationFormSubmitData } from '../_components/ApplicationForm';
import { isApiFailure } from '@/libs/custom-instance';

export default function CreateApplicationPage() {
  const _router = useRouter();
  const { mutateAsync: createApplication, isPending } = usePostApplications();

  // We handle success/error manually to control the redirect/modal flow

  const handleSubmit = async (data: ApplicationFormSubmitData): Promise<ApplicationDto | void> => {
    const payload: CreateApplicationRequest = {
      clientId: data.clientId,
      displayName: data.displayName,
      type: data.clientType,
      redirectUris: data.redirectUris,
      postLogoutRedirectUris: data.postLogoutRedirectUris || null,
      permissions: data.permissions || null
    };

    const result = await createApplication({ data: payload });

    if (result.success) {
      toast.success('Application created successfully');

      return result.result || undefined;
    } else if (isApiFailure(result)) {
      result.errors.forEach(err => toast.error(err.message));
    } else {
      toast.error(result.message || 'Failed to create application');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <ApplicationForm onSubmit={handleSubmit} isLoading={isPending} />
    </Box>
  );
}
