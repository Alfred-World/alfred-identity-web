'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type BillingCardProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: {
    name?: string
    cardCvv?: string
    expiryDate?: string
    cardNumber?: string
  }
}

const BillingCard = ({ open, setOpen, data }: BillingCardProps) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
      <DialogTitle>{data ? 'Edit Card' : 'Add New Card'}</DialogTitle>
      <DialogContent className='pt-4!'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Card Number'
              placeholder='0000 0000 0000 0000'
              defaultValue={data?.cardNumber}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Name on Card' defaultValue={data?.name} placeholder='John Doe' />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomTextField fullWidth label='Expiry Date' placeholder='MM/YY' defaultValue={data?.expiryDate} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomTextField fullWidth label='CVV' placeholder='654' defaultValue={data?.cardCvv} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant='contained' onClick={() => setOpen(false)}>
          {data ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BillingCard
