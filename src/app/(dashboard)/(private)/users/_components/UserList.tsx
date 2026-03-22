'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { AdvancedTable } from '@/components/AdvancedTable/AdvancedTable';
import { useUrlPagination, useUrlSorting } from '@/components/UrlPagination';
import type { ColumnConfig } from '@/components/AdvancedTable';

import CustomAvatar from '@core/components/mui/Avatar';
import OptionMenu from '@core/components/option-menu';
import { customFetch } from '@/libs/custom-instance';

import {
  getGetIdentityMgmtUsersQueryKey,
  useGetIdentityMgmtUsers,
  usePostIdentityMgmtUsersUserIdBan,
  usePostIdentityMgmtUsersUserIdUnban
} from '@/generated/identity-api';
import type { UserDto } from '@/generated/identity-api';

import AddUserDialog from './AddUserDialog';
import BanUserDialog from './BanUserDialog';

type BanDialogState = {
  userId: string;
  userDisplayName: string;
};

const UserList = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [banDialogState, setBanDialogState] = useState<BanDialogState | null>(null);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);

  const refreshUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetIdentityMgmtUsersQueryKey() });
  }, [queryClient]);

  const syncUsers = useCallback(async () => {
    setIsSyncingUsers(true);

    try {
      await queryClient.invalidateQueries({ queryKey: getGetIdentityMgmtUsersQueryKey() });
      toast.success('Users synced successfully');
    } catch {
      toast.error('Failed to sync users');
    } finally {
      setIsSyncingUsers(false);
    }
  }, [queryClient]);

  const { mutate: banUser, isPending: isBanningUser } = usePostIdentityMgmtUsersUserIdBan({
    mutation: {
      onSuccess: response => {
        if (response.success) {
          toast.success('User has been banned successfully');
          setBanDialogState(null);
          refreshUsers();

          return;
        }

        toast.error(response.errors?.[0]?.message || 'Failed to ban user');
      },
      onError: () => {
        toast.error('Failed to ban user');
      }
    }
  });

  const { mutate: unbanUser, isPending: isUnbanningUser } = usePostIdentityMgmtUsersUserIdUnban({
    mutation: {
      onSuccess: response => {
        if (response.success) {
          toast.success('User has been unbanned successfully');
          refreshUsers();

          return;
        }

        toast.error(response.errors?.[0]?.message || 'Failed to unban user');
      },
      onError: () => {
        toast.error('Failed to unban user');
      }
    }
  });

  const confirmUserEmail = useCallback(
    async (userId: string) => {
      setIsConfirmingEmail(true);

      try {
        const response = await customFetch<{ success: boolean; errors?: { message?: string }[] }>(
          `/identity/mgmt/users/${userId}/confirm-email`,
          {
            method: 'POST'
          }
        );

        if (response.success) {
          toast.success('User email has been verified successfully');
          refreshUsers();

          return;
        }

        toast.error(response.errors?.[0]?.message || 'Failed to verify user email');
      } catch {
        toast.error('Failed to verify user email');
      } finally {
        setIsConfirmingEmail(false);
      }
    },
    [refreshUsers]
  );

  const { page, pageSize, setPage, setPageSize } = useUrlPagination();
  const { sort, sorting, setSorting } = useUrlSorting();

  const { data: usersResponse, isLoading, error } = useGetIdentityMgmtUsers({
    page,
    pageSize,
    sort,
    view: 'detail'
  });

  const usersLoadError = useMemo(() => {
    if (!error) {
      return null;
    }

    if (error instanceof Error) {
      return error.message;
    }

    const apiError = error as { errors?: Array<{ message?: string }>; message?: string };

    return apiError.errors?.[0]?.message || apiError.message || 'Failed to load users';
  }, [error]);

  const [lastUsersLoadError, setLastUsersLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (usersLoadError && usersLoadError !== lastUsersLoadError) {
      toast.error(usersLoadError);
      setLastUsersLoadError(usersLoadError);

      return;
    }

    if (!usersLoadError && lastUsersLoadError) {
      setLastUsersLoadError(null);
    }
  }, [lastUsersLoadError, usersLoadError]);

  const users = useMemo(() => {
    if (!usersResponse?.success) {
      return [];
    }

    return usersResponse.result?.items || [];
  }, [usersResponse]);

  const totalUsers = useMemo(() => {
    if (!usersResponse?.success) {
      return 0;
    }

    return usersResponse.result?.total ?? 0;
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
        name: 'Email Confirmed',
        key: 'emailConfirmed',
        dataType: 'bool',
        enableSorting: true,
        renderCell: value => (
          <Chip
            size='small'
            variant='tonal'
            color={value ? 'success' : 'error'}
            label={value ? 'Yes' : 'No'}
          />
        )
      },
      {
        name: 'Role',
        key: 'roles',
        dataType: 'string',
        renderCell: value => {
          const roles = value as { name: string; icon?: string }[];

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
              {displayRoles.map((role: { name: string; icon?: string }, index: number) => {
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
          else if (status.toLowerCase() === 'banned') color = 'error';
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
        renderCell: (_value, row) => {
          const userId = row.id;
          const isBanned = (row.status || '').toLowerCase() === 'banned';
          const isEmailConfirmed = !!row.emailConfirmed;
          const userDisplayName = row.fullName || row.email || 'this user';

          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton disabled>
                <i className='ri-edit-line' />
              </IconButton>
              <IconButton disabled>
                <i className='ri-delete-bin-line' />
              </IconButton>
              <OptionMenu
                iconButtonProps={{ size: 'medium' }}
                iconClassName='ri-more-2-line'
                options={[
                  { text: 'View Details', menuItemProps: { disabled: true } },
                  {
                    text: isEmailConfirmed ? 'Email Verified' : 'Verify Email',
                    icon: <i className={isEmailConfirmed ? 'ri-checkbox-circle-line' : 'ri-mail-check-line'} />,
                    menuItemProps: {
                      disabled: isEmailConfirmed || !userId || isConfirmingEmail,
                      onClick: () => {
                        if (!userId || isEmailConfirmed) {
                          return;
                        }

                        void confirmUserEmail(userId);
                      }
                    }
                  },
                  isBanned
                    ? {
                        text: 'Unban User',
                        icon: <i className='ri-user-unfollow-line' />,
                        menuItemProps: {
                          disabled: !userId || isUnbanningUser,
                          onClick: () => {
                            if (!userId) {
                              return;
                            }

                            unbanUser({ userId });
                          }
                        }
                      }
                    : {
                        text: 'Ban User',
                        icon: <i className='ri-forbid-line' />,
                        menuItemProps: {
                          disabled: !userId || isBanningUser,
                          onClick: () => {
                            if (!userId) {
                              return;
                            }

                            setBanDialogState({ userId, userDisplayName });
                          }
                        }
                      }
                ]}
              />
            </Box>
          );
        }
      }
    ],
    [confirmUserEmail, isBanningUser, isConfirmingEmail, isUnbanningUser, unbanUser]
  );

  return (
    <>
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              color='secondary'
              startIcon={
                <i className={isSyncingUsers ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'} />
              }
              disabled={isSyncingUsers || isLoading}
              onClick={() => {
                void syncUsers();
              }}
            >
              Sync Users
            </Button>
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={() => setIsAddDialogOpen(true)}>
              Add New User
            </Button>
          </Box>
        }
      />

      <AddUserDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSuccess={refreshUsers} />

      <BanUserDialog
        open={!!banDialogState}
        userDisplayName={banDialogState?.userDisplayName || 'this user'}
        isSubmitting={isBanningUser}
        onClose={() => setBanDialogState(null)}
        onConfirm={({ reason, expiresAt }) => {
          if (!banDialogState) {
            return;
          }

          banUser({
            userId: banDialogState.userId,
            data: {
              reason,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
            }
          });
        }}
      />
    </>
  );
};

export default UserList;
