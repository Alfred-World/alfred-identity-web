'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

// Generated Imports
import {
  useGetIdentityAccountMe,
  usePostIdentityAccount2faEnable,
  usePostIdentityAccount2faConfirm,
  usePostIdentityAccount2faDisable,
  getGetIdentityAccountMeQueryKey
} from '@/generated/api'
import type { InitiateEnableTwoFactorResult } from '@/generated/api'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import Link from '@components/Link'


// ─── Enable 2FA Dialog ───────────────────────────────────────────────────────
type EnableDialogProps = {
  open: boolean
  onClose: () => void
  setupData: InitiateEnableTwoFactorResult | null
  onConfirmed: () => void
}

const EnableTwoFactorDialog = ({ open, onClose, setupData, onConfirmed }: EnableDialogProps) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const { mutate: confirm, isPending } = usePostIdentityAccount2faConfirm({
    mutation: {
      onSuccess(data) {
        if (data.success) {
          toast.success('Two-factor authentication enabled')
          setCode('')
          setError('')
          onConfirmed()
        } else {
          const msg = data.errors?.[0]?.message ?? 'Invalid code'

          setError(msg)
        }
      },
      onError() {
        setError('An unexpected error occurred')
      }
    }
  })

  const handleSubmit = () => {
    if (!code.trim()) {
      setError('Please enter the 6-digit code');

      return
    }

    setError('')
    confirm({ data: { code } })
  }

  const handleClose = () => {
    setCode('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
      <DialogContent className='flex flex-col gap-6 pt-4'>
        <Typography>
          Scan the QR code below with your authenticator app (e.g. Google Authenticator, Authy), then enter the
          6-digit code to confirm setup.
        </Typography>

        {setupData?.qrCodeUri && (
          <div className='flex justify-center'>
            <img
              src={setupData.qrCodeUri}
              alt='2FA QR Code'
              width={200}
              height={200}
              style={{ border: '1px solid #eee', borderRadius: 8 }}
            />
          </div>
        )}

        {setupData?.secret && (
          <div className='flex flex-col gap-1'>
            <Typography variant='body2' color='text.secondary'>
              Or enter the secret key manually:
            </Typography>
            <Typography
              variant='body2'
              fontFamily='monospace'
              className='bg-actionHover p-2 rounded select-all break-all'
            >
              {setupData.secret}
            </Typography>
          </div>
        )}

        <CustomTextField
          fullWidth
          label='Verification Code'
          placeholder='000000'
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          error={!!error}
          helperText={error}
          slotProps={{
            htmlInput: { maxLength: 8, inputMode: 'numeric' },
            input: {
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton edge='end' onClick={() => setCode('')} disabled={!code}>
                    <i className='tabler-x text-sm' />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='secondary' variant='tonal' disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={isPending || !code.trim()}>
          {isPending ? <CircularProgress size={20} color='inherit' /> : 'Verify & Enable'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
const TwoFactorAuthenticationCard = () => {
  const queryClient = useQueryClient()
  const [enableDialogOpen, setEnableDialogOpen] = useState(false)
  const [setupData, setSetupData] = useState<InitiateEnableTwoFactorResult | null>(null)

  // Load 2FA status from same profile cache
  const { data: profileResponse, isLoading } = useGetIdentityAccountMe()

  const twoFactorEnabled = profileResponse?.success ? (profileResponse.result?.twoFactorEnabled ?? false) : false

  // Enable 2FA: initiate
  const { mutate: initiateEnable, isPending: isInitiating } = usePostIdentityAccount2faEnable({
    mutation: {
      onSuccess(data) {
        if (data.success && data.result) {
          setSetupData(data.result)
          setEnableDialogOpen(true)
        } else {
          toast.error(data.errors?.[0]?.message ?? 'Failed to initiate 2FA setup')
        }
      },
      onError() {
        toast.error('An unexpected error occurred')
      }
    }
  })

  // Disable 2FA
  const { mutate: disable2fa, isPending: isDisabling } = usePostIdentityAccount2faDisable({
    mutation: {
      onSuccess(data) {
        if (data.success) {
          toast.success('Two-factor authentication disabled')
          queryClient.invalidateQueries({ queryKey: getGetIdentityAccountMeQueryKey() })
        } else {
          toast.error('Failed to disable two-factor authentication')
        }
      },
      onError() {
        toast.error('An unexpected error occurred')
      }
    }
  })

  const handleEnableClick = () => {
    initiateEnable()
  }

  const handleDisableClick = () => {
    disable2fa()
  }

  const handleConfirmed = () => {
    setEnableDialogOpen(false)
    setSetupData(null)
    queryClient.invalidateQueries({ queryKey: getGetIdentityAccountMeQueryKey() })
  }

  return (
    <>
      <Card>
        <CardHeader title='Two-steps verification' />
        <CardContent className='flex flex-col items-start gap-6'>
          {isLoading ? (
            <CircularProgress size={24} />
          ) : twoFactorEnabled ? (
            <>
              <Alert severity='success' className='w-full'>
                Two-factor authentication is currently <strong>enabled</strong> on your account.
              </Alert>
              <Typography color='text.secondary'>
                Your account is protected with an additional layer of security. You will be asked for a verification
                code when you sign in.
              </Typography>
              <Button
                variant='outlined'
                color='error'
                onClick={handleDisableClick}
                disabled={isDisabling}
                startIcon={isDisabling ? <CircularProgress size={16} color='inherit' /> : undefined}
              >
                {isDisabling ? 'Disabling...' : 'Disable two-factor authentication'}
              </Button>
            </>
          ) : (
            <>
              <div className='flex flex-col gap-4'>
                <Typography variant='h5' color='text.secondary'>
                  Two factor authentication is not enabled yet.
                </Typography>
                <Typography>
                  Two-factor authentication adds an additional layer of security to your account by requiring more than
                  just a password to log in.
                  <Link className='text-primary'> Learn more.</Link>
                </Typography>
              </div>

              <Button
                variant='contained'
                onClick={handleEnableClick}
                disabled={isInitiating}
                startIcon={isInitiating ? <CircularProgress size={16} color='inherit' /> : undefined}
              >
                {isInitiating ? 'Setting up...' : 'Enable two-factor authentication'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <EnableTwoFactorDialog
        open={enableDialogOpen}
        onClose={() => { setEnableDialogOpen(false); setSetupData(null) }}
        setupData={setupData}
        onConfirmed={handleConfirmed}
      />
    </>
  )
}

export default TwoFactorAuthenticationCard

