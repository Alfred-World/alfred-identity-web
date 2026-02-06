'use client';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';

import UserStatistics from './_components/UserStatistics';
import UserList from './_components/UserList';

const UsersPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <UserStatistics />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <UserList />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UsersPage;
