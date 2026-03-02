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

type AddressData = {
  firstName?: string
  lastName?: string
  email?: string
  country?: string
  address1?: string
  address2?: string
  landmark?: string
  city?: string
  state?: string
  zipCode?: string
  taxId?: string
  vatNumber?: string
  contact?: string
}

type AddNewAddressProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: AddressData
}

const AddNewAddress = ({ open, setOpen, data }: AddNewAddressProps) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle>{data ? 'Edit Address' : 'Add New Address'}</DialogTitle>
      <DialogContent className='pt-4!'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='First Name' defaultValue={data?.firstName} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Last Name' defaultValue={data?.lastName} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Email' defaultValue={data?.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Contact' defaultValue={data?.contact} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField fullWidth label='Address Line 1' defaultValue={data?.address1} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField fullWidth label='Address Line 2' defaultValue={data?.address2} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField fullWidth label='City' defaultValue={data?.city} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField fullWidth label='State' defaultValue={data?.state} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField fullWidth label='Zip Code' defaultValue={data?.zipCode} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='Tax ID' defaultValue={data?.taxId} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField fullWidth label='VAT Number' defaultValue={data?.vatNumber} />
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

export default AddNewAddress
