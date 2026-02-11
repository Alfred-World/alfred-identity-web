'use client';

import { useMemo } from 'react';

import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { AdvancedTable } from '@/components/AdvancedTable/AdvancedTable';
import { useUrlPagination, useUrlSorting } from '@/components/UrlPagination';
import type { ColumnConfig } from '@/components/AdvancedTable';

import CustomAvatar from '@core/components/mui/Avatar';
import OptionMenu from '@core/components/option-menu';

import { useGetUsers } from '@/generated/identity-api';
import type { UserDto } from '@/generated/identity-api';

const UserList = () => {
  // Get pagination from URL
  const { page, pageSize, setPage, setPageSize } = useUrlPagination();
  const { sort, sorting, setSorting } = useUrlSorting();

  // Fetch users from API
  const { data: usersResponse, isLoading } = useGetUsers({
    page,
    pageSize,
    sort
  });

  const users = useMemo(() => {
    if (!usersResponse || !usersResponse.success) {
      return [];
    }

    if ('result' in usersResponse && usersResponse.result?.items) {
      return usersResponse.result.items;
    }

    return [];
  }, [usersResponse]);

  const totalUsers = useMemo(() => {
    if (usersResponse && 'result' in usersResponse) {
      return usersResponse.result?.total ?? 0;
    }

    return 0;
  }, [usersResponse]);

  const userFields: ColumnConfig<UserDto>[] = useMemo(
    () => [
      {
        name: 'User',
        key: 'fullName',
        dataType: 'string',
        enableSorting: true,
        renderCell: (_value, row) => {
          const fullName = row.fullName || 'Unknown User';
          const userName = row.userName || 'unknown';

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <CustomAvatar skin='light' color='primary' variant='rounded' size={34}>
                {fullName.charAt(0).toUpperCase()}
              </CustomAvatar>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                  {fullName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  @{userName}
                </Typography>
              </Box>
            </Box>
          );
        }
      },
      {
        name: 'Email',
        key: 'email',
        dataType: 'string',
        enableSorting: true,
        renderCell: value => <Typography color='text.primary'>{(value as string) || '-'}</Typography>
      },
      {
        name: 'Role',
        key: 'roles',
        dataType: 'string',
        renderCell: value => {
          const roles = value as any[];

          if (!roles || roles.length === 0) {
            return <Typography color='text.secondary'>-</Typography>;
          }

          const displayRoles = roles.slice(0, 3);
          const remaining = roles.length - 3;

          const getRoleColor = (roleName: string) => {
            const colors: ('primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error')[] = [
              'primary',
              'secondary',
              'success',
              'warning',
              'info',
              'error'
            ];

            let hash = 0;

            for (let i = 0; i < roleName.length; i++) {
              hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
            }

            const index = Math.abs(hash % colors.length);

            return colors[index];
          };

          return (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {displayRoles.map((role: any, index: number) => {
                const color = getRoleColor(role.name);

                return (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CustomAvatar skin='light' color={color} variant='rounded' size={28}>
                      <i className={role.icon || 'ri-shield-user-line'} style={{ fontSize: 16 }} />
                    </CustomAvatar>
                    <Typography
                      variant='body2'
                      sx={{
                        color: `var(--mui-palette-${color}-main)`,
                        fontWeight: 500
                      }}
                    >
                      {role.name}
                    </Typography>
                  </Box>
                );
              })}
              {remaining > 0 && (
                <Typography variant='body2' color='text.secondary'>
                  +{remaining}
                </Typography>
              )}
            </Box>
          );
        }
      },
      {
        name: 'Status',
        key: 'status',
        dataType: 'string',
        enableSorting: true,
        renderCell: value => {
          const status = (value as string) || 'unknown';
          let color: 'success' | 'warning' | 'secondary' | 'error' | 'info' = 'secondary';

          if (status.toLowerCase() === 'active') color = 'success';
          else if (status.toLowerCase() === 'pending') color = 'warning';
          else if (status.toLowerCase() === 'inactive') color = 'error';

          return <Chip label={status} color={color} variant='tonal' size='small' className='capitalize' />;
        }
      },
      {
        name: 'Actions',
        key: 'actions',
        dataType: 'string',
        width: 100,
        renderCell: () => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton>
              <i className='ri-edit-line' />
            </IconButton>
            <IconButton>
              <i className='ri-delete-bin-line' />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='ri-more-2-line'
              options={['View Details', 'Suspend User']}
            />
          </Box>
        )
      }
    ],
    []
  );

  return (
    <AdvancedTable
      data={users}
      columns={userFields}
      total={totalUsers}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sorting={sorting}
      onSortingChange={setSorting}
      enableRowSelection={true}
      title='Users'
      isLoading={isLoading}
      headerRightContent={
        <Button variant='contained' startIcon={<i className='ri-add-line' />}>
          Add New User
        </Button>
      }
    />
  );
};

export default UserList;
