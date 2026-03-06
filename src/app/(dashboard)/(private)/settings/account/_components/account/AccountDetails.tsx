'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

// Generated Imports
import {
  useGetIdentityAccountMe,
  usePutIdentityAccountProfile,
  getGetIdentityAccountMeQueryKey,
} from '@/generated/api'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type FormData = {
  fullName: string
  phoneNumber: string
}

// ─── Component ───────────────────────────────────────────────────────────────
const AccountDetails = () => {
  const queryClient = useQueryClient()

  // ── Load profile ─────────────────────────────────────────────────────────
  const { data: profileResponse, isLoading, isError } = useGetIdentityAccountMe()

  const profile = profileResponse?.success ? profileResponse.result ?? null : null

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({ fullName: '', phoneNumber: '' })
  const [fileInput, setFileInput] = useState<string>('')
  const [imgSrc, setImgSrc] = useState<string>('/images/avatars/1.png')
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Sync form with loaded profile
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName ?? '',
        phoneNumber: profile.phoneNumber ?? ''
      })
      if (profile.avatar) setImgSrc(profile.avatar)
    }
  }, [profile])

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleFileInputChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => {
        const result = reader.result as string

        setImgSrc(result)
        setAvatarBase64(result)
        setFileInput(result)
        setIsDirty(true)
      }

      reader.readAsDataURL(files[0])
    }
  }

  const handleFileInputReset = () => {
    setFileInput('')
    setImgSrc(profile?.avatar ?? '/images/avatars/1.png')
    setAvatarBase64(null)
    setIsDirty(false)
  }

  // ── Update profile ────────────────────────────────────────────────────────
  const { mutate: updateProfile, isPending } = usePutIdentityAccountProfile({
    mutation: {
      onSuccess(data) {
        if (data.success) {
          queryClient.invalidateQueries({ queryKey: getGetIdentityAccountMeQueryKey() })
          setIsDirty(false)
          setAvatarBase64(null)
          toast.success('Profile updated successfully')
        } else {
          const msg = data?.errors?.[0]?.message ?? 'Failed to update profile'

          toast.error(msg)
        }
      },
      onError() {
        toast.error('An unexpected error occurred')
      }
    }
  })

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      toast.error('Full name is required')

      return
    }

    updateProfile({
      data: {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        avatar: avatarBase64 ?? undefined
      }
    })
  }

  const handleReset = () => {
    if (profile) {
      setFormData({ fullName: profile.fullName ?? '', phoneNumber: profile.phoneNumber ?? '' })
      setImgSrc(profile.avatar ?? '/images/avatars/1.png')
      setAvatarBase64(null)
      setFileInput('')
      setIsDirty(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex justify-center p-8'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError || !profile) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error'>Failed to load profile. Please refresh the page.</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='mbe-4'>
        <div className='flex max-sm:flex-col items-center gap-6'>
          <img height={100} width={100} className='rounded' src={imgSrc} alt='Profile' />
          <div className='flex grow flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Button component='label' variant='contained' htmlFor='account-settings-upload-image'>
                Upload New Photo
                <input
                  hidden
                  type='file'
                  value={fileInput}
                  accept='image/png, image/jpeg'
                  onChange={handleFileInputChange}
                  id='account-settings-upload-image'
                />
              </Button>
              <Button variant='tonal' color='secondary' onClick={handleFileInputReset}>
                Reset
              </Button>
            </div>
            <Typography>Allowed JPG, GIF or PNG. Max size of 800K</Typography>
          </div>
        </div>
      </CardContent>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Full Name'
                value={formData.fullName}
                placeholder='John Doe'
                onChange={e => handleFormChange('fullName', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Email'
                value={profile.email}
                placeholder='john.doe@gmail.com'
                disabled
                helperText='Email cannot be changed here'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Username'
                value={profile.userName}
                disabled
                helperText='Username cannot be changed'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Phone Number'
                value={formData.phoneNumber}
                placeholder='+1 (234) 567-8901'
                onChange={e => handleFormChange('phoneNumber', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4'>
              <Button variant='contained' type='submit' disabled={isPending || !isDirty}>
                {isPending ? <CircularProgress size={20} color='inherit' /> : 'Save Changes'}
              </Button>
              <Button variant='tonal' type='button' color='secondary' onClick={handleReset} disabled={!isDirty}>
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default AccountDetails
