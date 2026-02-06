'use client';

import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';

import UserStatCard from './UserStatCard';

const UserStatistics = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <UserStatCard
          title='Total Users'
          value='2,543'
          icon='ri-group-line'
          color='primary'
          trend={{ value: 12, label: 'up' }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <UserStatCard
          title='Active Users'
          value='1,892'
          icon='ri-user-follow-line'
          color='success'
          trend={{ value: 5, label: 'up' }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <UserStatCard
          title='New This Month'
          value='142'
          icon='ri-user-add-line'
          color='secondary' // Purple usually
          trend={{ value: -2, label: 'down' }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <UserStatCard
          title='Roles Distributed'
          value='4'
          icon='ri-shield-check-line'
          color='warning' // Orange usually
          secondaryContent={
            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.875rem' } }}>
              <Tooltip title='Admin'>
                <Avatar alt='Admin' src='/images/avatars/1.png' />
              </Tooltip>
              <Tooltip title='Editor'>
                <Avatar alt='Editor' src='/images/avatars/2.png' />
              </Tooltip>
              <Tooltip title='Viewer'>
                <Avatar alt='Viewer' src='/images/avatars/3.png' />
              </Tooltip>
              <Tooltip title='Manager'>
                <Avatar alt='Manager' src='/images/avatars/4.png' />
              </Tooltip>
            </AvatarGroup>
          }
        />
      </Grid>
    </Grid>
  );
};

export default UserStatistics;
