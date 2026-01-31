'use client'

import { useRouter } from 'next/navigation'

import { Box } from '@mui/material'
import { toast } from 'react-toastify'

import { usePostApplications, type CreateApplicationRequest, type ApplicationDto } from '@/generated'
import { ApplicationForm, type ApplicationFormSubmitData } from '../_components/ApplicationForm'
import type { ApiReturnFailure } from '@/libs/custom-instance'

export default function CreateApplicationPage() {
  const _router = useRouter()
  const { mutateAsync: createApplication, isPending } = usePostApplications()

  // We handle success/error manually to control the redirect/modal flow

  const handleSubmit = async (data: ApplicationFormSubmitData): Promise<ApplicationDto | void> => {
    const payload: CreateApplicationRequest = {
      clientId: data.clientId,
      displayName: data.displayName,
      type: data.clientType,
      redirectUris: data.redirectUris,
      postLogoutRedirectUris: data.postLogoutRedirectUris || null,
      permissions: data.permissions || null
    }

    try {
      const result = await createApplication({ data: payload })

      if (result.success) {
        toast.success('Application created successfully')

        return result.result
      } else {
        toast.error(result.message || 'Failed to create application')
      }
    } catch (e: unknown) {
      const error = e as {
        response?: { data?: ApiReturnFailure | { title?: string; errors?: Record<string, string[]> } }
        message?: string
      }

      const errorData = error.response?.data

      if (errorData && 'errors' in errorData && Array.isArray(errorData.errors)) {
        errorData.errors.forEach(err => toast.error(err.message))
      } else if (errorData && 'errors' in errorData && errorData.errors && typeof errorData.errors === 'object') {
        // Handle validation errors from backend
        Object.values(errorData.errors as Record<string, string[]>)
          .flat()
          .forEach(msg => toast.error(String(msg)))
      } else {
        toast.error((errorData as { title?: string })?.title || error.message || 'Failed to create application')
      }
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <ApplicationForm onSubmit={handleSubmit} isLoading={isPending} />
    </Box>
  )
}
