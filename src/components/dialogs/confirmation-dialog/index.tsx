'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

type ConfirmationDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  type?: 'unsubscribe' | 'suspend-account' | 'delete-account'
}

const ConfirmationDialog = ({ open, setOpen, type }: ConfirmationDialogProps) => {
  const titles: Record<string, string> = {
    unsubscribe: 'Unsubscribe',
    'suspend-account': 'Suspend Account',
    'delete-account': 'Delete Account'
  }

  const descriptions: Record<string, string> = {
    unsubscribe: 'Are you sure you would like to cancel your subscription?',
    'suspend-account': 'Are you sure you would like to suspend this account?',
    'delete-account': 'Are you sure you would like to delete your account?'
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='xs' fullWidth>
      <DialogTitle>{type ? titles[type] : 'Confirm'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{type ? descriptions[type] : 'Are you sure?'}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant='contained' color='error' onClick={() => setOpen(false)}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmationDialog
