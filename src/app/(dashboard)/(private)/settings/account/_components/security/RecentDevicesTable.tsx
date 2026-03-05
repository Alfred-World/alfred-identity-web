'use client'

// React Imports
import type { ReactElement } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

// Generated Imports
import {
  useGetIdentityAccountSessions,
  useDeleteIdentityAccountSessionsId,
  getGetIdentityAccountSessionsQueryKey
} from '@/generated/api'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// ─── Helpers ────────────────────────────────────────────────────────────────
const getBrowserIcon = (device: string | null | undefined): ReactElement => {
  const d = (device ?? '').toLowerCase()

  if (d.includes('iphone') || d.includes('ios')) return <i className='tabler-device-mobile text-[22px] text-error' />
  if (d.includes('android')) return <i className='tabler-brand-android text-[22px] text-success' />
  if (d.includes('mac') || d.includes('apple')) return <i className='tabler-brand-apple text-[22px] text-secondary' />
  if (d.includes('windows')) return <i className='tabler-brand-windows text-[22px] text-info' />
  if (d.includes('linux')) return <i className='tabler-brand-ubuntu text-[22px] text-warning' />
  
return <i className='tabler-device-desktop text-[22px] text-primary' />
}

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return iso }
}

const RecentDevicesTable = () => {
  const queryClient = useQueryClient()

  // Fetch sessions
  const { data: sessionsResponse, isLoading, isError } = useGetIdentityAccountSessions()

  const sessions = sessionsResponse?.success ? (sessionsResponse.result ?? []) : []

  // Revoke session
  const { mutate: revokeSession, variables: revokingVars } = useDeleteIdentityAccountSessionsId({
    mutation: {
      onSuccess(data) {
        if (data.success) {
          toast.success('Session revoked successfully')
          queryClient.invalidateQueries({ queryKey: getGetIdentityAccountSessionsQueryKey() })
        } else {
          toast.error(data.errors?.[0]?.message ?? 'Failed to revoke session')
        }
      },
      onError() {
        toast.error('An unexpected error occurred')
      }
    }
  })

  return (
    <Card>
      <CardHeader title='Recent Devices' />

      {isLoading && (
        <div className='flex justify-center p-6'>
          <CircularProgress />
        </div>
      )}

      {isError && (
        <div className='p-4'>
          <Alert severity='error'>Failed to load sessions. Please refresh the page.</Alert>
        </div>
      )}

      {!isLoading && !isError && (
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Browser / Device</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Connected At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <Typography className='text-center py-4' color='text.secondary'>
                      No active sessions found.
                    </Typography>
                  </td>
                </tr>
              )}
              {sessions.map(session => (
                <tr key={session.id}>
                  <td>
                    <div className='flex items-center gap-2.5'>
                      {getBrowserIcon(session.device)}
                      <div className='flex flex-col'>
                        <Typography className='font-medium' color='text.primary'>
                          {session.device}
                        </Typography>
                        {session.isCurrentSession && (
                          <Chip label='Current' size='small' color='success' variant='tonal' />
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Typography>{session.ipAddress ?? '—'}</Typography>
                  </td>
                  <td>
                    <Typography>{session.location ?? '—'}</Typography>
                  </td>
                  <td>
                    <Typography>{formatDate(session.createdAt ?? '')}</Typography>
                  </td>
                  <td>
                    {!session.isCurrentSession && (
                      <Button
                        size='small'
                        variant='tonal'
                        color='error'
                        disabled={revokingVars?.id === session.id}
                        onClick={() => revokeSession({ id: session.id! })}
                        startIcon={
                          revokingVars?.id === session.id ? (
                            <CircularProgress size={14} color='inherit' />
                          ) : (
                            <i className='tabler-logout text-sm' />
                          )
                        }
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default RecentDevicesTable
