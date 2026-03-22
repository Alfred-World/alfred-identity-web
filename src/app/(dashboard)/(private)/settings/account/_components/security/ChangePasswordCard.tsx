'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { toast } from 'react-toastify'

// Generated Imports
import { usePostIdentityAccountChangePassword } from '@/generated/identity-api'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// ─── Initial State ─────────────────────────────────────────────────────────
const INITIAL = { currentPassword: '', newPassword: '', confirmPassword: '' }

const ChangePasswordCard = () => {
  const [form, setForm] = useState(INITIAL)
  const [isCurrentPasswordShown, setIsCurrentPasswordShown] = useState(false)
  const [isNewPasswordShown, setIsNewPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutate: changePassword, isPending } = usePostIdentityAccountChangePassword({
    mutation: {
      onSuccess(data) {
        if (data.success) {
          toast.success('Password changed successfully')
          setForm(INITIAL)
          setErrors({})
        } else {
          const apiErrors = data.errors ?? []

          toast.error(apiErrors[0]?.message ?? 'Failed to change password')
        }
      },
      onError() {
        toast.error('An unexpected error occurred')
      }
    }
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!form.currentPassword) newErrors.currentPassword = 'Current password is required'
    if (!form.newPassword) newErrors.newPassword = 'New password is required'
    else if (form.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters'
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your new password'
    else if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!validate()) return
    changePassword({ data: { oldPassword: form.currentPassword, newPassword: form.newPassword } })
  }

  const field = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  return (
    <Card>
      <CardHeader title='Change Password' />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Current Password'
                type={isCurrentPasswordShown ? 'text' : 'password'}
                placeholder='············'
                value={form.currentPassword}
                onChange={e => field('currentPassword', e.target.value)}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsCurrentPasswordShown(v => !v)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isCurrentPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
          </Grid>
          <Grid container className='mbs-6' spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='New Password'
                type={isNewPasswordShown ? 'text' : 'password'}
                placeholder='············'
                value={form.newPassword}
                onChange={e => field('newPassword', e.target.value)}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsNewPasswordShown(v => !v)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isNewPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Confirm New Password'
                type={isConfirmPasswordShown ? 'text' : 'password'}
                placeholder='············'
                value={form.confirmPassword}
                onChange={e => field('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsConfirmPasswordShown(v => !v)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} className='flex flex-col gap-4'>
              <Typography variant='h6'>Password Requirements:</Typography>
              <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-2.5'>
                  <i className='tabler-circle-filled text-[8px]' />
                  Minimum 8 characters long - the more, the better
                </div>
                <div className='flex items-center gap-2.5'>
                  <i className='tabler-circle-filled text-[8px]' />
                  At least one lowercase & one uppercase character
                </div>
                <div className='flex items-center gap-2.5'>
                  <i className='tabler-circle-filled text-[8px]' />
                  At least one number, symbol, or whitespace character
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4'>
              <Button variant='contained' type='submit' disabled={isPending}>
                {isPending ? <CircularProgress size={20} color='inherit' /> : 'Save Changes'}
              </Button>
              <Button
                variant='tonal'
                type='button'
                color='secondary'
                onClick={() => { setForm(INITIAL); setErrors({}) }}
                disabled={isPending}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePasswordCard
