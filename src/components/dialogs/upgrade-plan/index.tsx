'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'

type UpgradePlanProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: PricingPlanType[]
}

const UpgradePlan = ({ open, setOpen, data }: UpgradePlanProps) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle>Upgrade Plan</DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          {data?.map((plan, index) => (
            <Grid key={index} size={{ xs: 12, sm: 4 }}>
              <div className='border rounded p-4 flex flex-col gap-2'>
                <Typography className='font-medium' color='text.primary'>
                  {plan.title}
                </Typography>
                <Typography variant='h5'>${plan.monthlyPrice}/mo</Typography>
                {plan.popularPlan && <Chip label='Popular' color='primary' size='small' variant='tonal' />}
                <Button
                  fullWidth
                  variant={plan.currentPlan ? 'tonal' : 'contained'}
                  color={plan.currentPlan ? 'secondary' : 'primary'}
                  disabled={plan.currentPlan}
                  onClick={() => setOpen(false)}
                >
                  {plan.currentPlan ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UpgradePlan
