'use client';

import { use } from 'react';

import { useRouter } from 'next/navigation';

import { Box, Typography, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

import { useGetIdentityV1ApplicationsId, usePatchIdentityV1ApplicationsId } from '@/generated/identity-api';
import type { UpdateApplicationRequest } from '@/generated/identity-api';
import { ApplicationForm } from '../_components/ApplicationForm';
import type { ApplicationFormSubmitData } from '../_components/ApplicationForm';
import { ROUTES } from '@/configs/routes';
import { getChangedFields } from '@/utils/getChangedFields';

export default function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const { data: applicationData, isLoading: isFetching } = useGetIdentityV1ApplicationsId(id);

  const { mutate: updateApplication, isPending: isUpdating } = usePatchIdentityV1ApplicationsId({
    mutation: {
      onSuccess: data => {
        if (data?.success) {
          toast.success('Application updated successfully');
          router.push(ROUTES.APPLICATIONS.LIST);
        } else if (data?.errors?.length) {
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
    const current: UpdateApplicationRequest = {
      displayName: data.displayName,
      redirectUris: data.redirectUris,
      postLogoutRedirectUris: data.postLogoutRedirectUris || undefined,
      permissions: data.permissions || undefined
    };

    const original: UpdateApplicationRequest = {
      displayName: result.displayName ?? '',
      redirectUris: Array.isArray(result.redirectUris) ? result.redirectUris.join(',') : (result.redirectUris ?? undefined),
      postLogoutRedirectUris: Array.isArray(result.postLogoutRedirectUris)
        ? result.postLogoutRedirectUris.join(',')
        : (result.postLogoutRedirectUris ?? undefined),
      permissions: Array.isArray(result.permissions) ? result.permissions.join(',') : (result.permissions ?? undefined)
    };

    const changes = getChangedFields(original, current);

    if (!changes) return;

    updateApplication({ id, data: changes });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <ApplicationForm initialData={result} isEdit={true} isLoading={isUpdating} onSubmit={handleSubmit} />
    </Box>
  );
}
