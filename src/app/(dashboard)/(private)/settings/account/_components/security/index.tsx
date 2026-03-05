// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChangePasswordCard from './ChangePasswordCard'
import TwoFactorAuthenticationCard from './TwoFactorAuthenticationCard'
import RecentDevicesTable from './RecentDevicesTable'

const Security = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ChangePasswordCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TwoFactorAuthenticationCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RecentDevicesTable />
      </Grid>
    </Grid>
  )
}

export default Security
