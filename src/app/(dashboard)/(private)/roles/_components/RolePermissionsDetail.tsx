'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

import { toast } from 'react-toastify';

import { usePostRolesIdPermissions, getPermissions } from '@/generated/identity-api';
import type { RoleDto, PermissionDto, PermissionDtoApiPagedResponse } from '@/generated/identity-api';

interface RolePermissionsDetailProps {
  role: RoleDto | null;
  isLoading?: boolean;
}

// Helper to safely extract items from an API page
const getItemsFromPage = (page: PermissionDtoApiPagedResponse) => {
  if (page.success && page.result?.items) {
    return page.result.items;
  }

  return [];
};

const RolePermissionsDetail = ({ role, isLoading }: RolePermissionsDetailProps) => {
  const theme = useTheme();
  const themeColor = theme.palette.primary.main;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // -- 1. Infinite Query for Permissions --
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingAll
  } = useInfiniteQuery({
    queryKey: ['permissions', 'infinite', 'list'],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      return await getPermissions({
        page: pageParam as number,
        pageSize: 50, // Load 50 items per page
        sort: 'resource,action' // Server sort by resource then action
      });
    },
    getNextPageParam: lastPage => {
      // Check for API success and pagination info
      if (lastPage.success && lastPage.result?.hasNextPage) {
        return (lastPage.result.page || 0) + 1;
      }

      return undefined;
    }
  });

  // Flatten all pages into a single list
  const allPermissions = useMemo(() => {
    return infiniteData?.pages.flatMap(getItemsFromPage) || [];
  }, [infiniteData]);

  // -- 2. Current Role Permissions --
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Sync state with role permissions
  useEffect(() => {
    if (role?.permissions && Array.isArray(role.permissions)) {
      const newIds = role.permissions.map(p => p.id!).filter(id => id !== undefined);

      setSelectedPermissionIds(newIds);
    }
  }, [role]);

  // -- 3. Mutations --
   
  const { mutate: updatePermissions, isPending: isUpdating } = usePostRolesIdPermissions({
    mutation: {
      onSuccess: (data: any) => {
        if (data.success) {
          toast.success('Permissions updated successfully');

          // Force a reload of the current page to get updated role data (including permissions)
          window.location.reload();
        } else {
          toast.error(data.errors?.[0]?.message || 'Failed to update permissions');
        }
      }
    }
  });
   

  // -- 4. Infinite Scroll Observer --
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];

      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    });

    const currentRef = loadMoreRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [handleObserver]);

  // -- 5. Grouping Logic --
  // Group by 'resource'
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionDto[]> = {};

    allPermissions.forEach(p => {
      const resource = p.resource || 'Other';

      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });

    return groups;
  }, [allPermissions]);

  // -- 6. Action Handlers --

  const handleToggle = (id: string) => {
    setSelectedPermissionIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleSelectAllGroup = (permsInGroup: PermissionDto[]) => {
    const idsToSelect = permsInGroup.map(p => p.id!).filter(id => id !== undefined);

    setSelectedPermissionIds(prev => {
      // Add only IDs that aren't already selected
      const newIds = idsToSelect.filter(id => !prev.includes(id));

      return [...prev, ...newIds];
    });
  };

  const handleRevokeAllGroup = (permsInGroup: PermissionDto[]) => {
    const idsToRevoke = permsInGroup.map(p => p.id!);

    setSelectedPermissionIds(prev => prev.filter(id => !idsToRevoke.includes(id)));
  };

  const handleSave = () => {
    if (!role?.id) return;
    updatePermissions({ id: role.id, data: selectedPermissionIds });
  };

  const handleReset = () => {
    if (role?.permissions && Array.isArray(role.permissions)) {
      const newIds = role.permissions.map(p => p.id!).filter(id => id !== undefined);

      if (newIds.length > 0) {
        setSelectedPermissionIds(newIds);
      } else {
        setSelectedPermissionIds([]);
      }
    } else {
      setSelectedPermissionIds([]);
    }
  };

  // -- Render --

  if (isLoading || isLoadingAll) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (!role) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 10 }}>
        <Typography color='text.secondary'>Select a role to manage permissions</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                display: 'flex'
              }}
            >
              <i className='tabler-shield-check' style={{ fontSize: '1.5rem' }} />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={600}>
                {role.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Manage access and system module permissions for this role.
              </Typography>
            </Box>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant='caption' color='text.secondary'>
              {selectedPermissionIds.length} permissions selected
            </Typography>
            <Button variant='text' color='secondary' onClick={handleReset} disabled={isUpdating || !!role.isImmutable}>
              Reset
            </Button>
            <Button
              variant='contained'
              startIcon={
                isUpdating ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-device-floppy' />
              }
              onClick={handleSave}
              disabled={isUpdating || !!role.isImmutable}
              sx={{
                bgcolor: role.isImmutable ? 'action.disabledBackground' : 'info.main',
                '&:hover': { bgcolor: role.isImmutable ? 'action.disabledBackground' : 'info.dark' },
                boxShadow: role.isImmutable ? 'none' : `0 0 15px ${alpha(theme.palette.info.main, 0.4)}`
              }}
            >
              Save Changes
            </Button>
          </Box>
        }
        sx={{ p: 4, pb: 2 }}
      />

      <Divider />

      <CardContent
        id='permissions-scroll-container'
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 4,
          maxHeight: 'calc(100vh - 300px)'
        }}
      >
        <Grid container spacing={6}>
          {Object.entries(groupedPermissions).map(([resource, perms]) => {
            // Note: This logic only considers *loaded* permissions for "All Selected" check
            const groupIds = perms.map(p => p.id!);

            const _isAllLoadedSelected =
              groupIds.length > 0 && groupIds.every(id => selectedPermissionIds.includes(id));

            return (
              <Grid size={{ xs: 12 }} key={resource}>
                {/* Sticky Header for Resource Group */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    position: 'sticky',
                    top: -24, // Offset for padding
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    py: 2,
                    borderBottom: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <i className='tabler-lock-open' style={{ color: theme.palette.info.main }} />
                    <Typography variant='subtitle1' fontWeight={600} color='text.primary'>
                      {resource} Management
                    </Typography>
                  </Box>
                  {!role.isImmutable && (
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Typography
                        variant='caption'
                        sx={{
                          cursor: 'pointer',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => handleSelectAllGroup(perms)}
                      >
                        Select All
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{
                          cursor: 'pointer',
                          color: 'error.main',
                          fontWeight: 600,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => handleRevokeAllGroup(perms)}
                      >
                        Revoke All
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={3}>
                  {perms.map(perm => {
                    const isSelected = selectedPermissionIds.includes(perm.id!);

                    return (
                      <Grid size={{ xs: 12 }} key={perm.id}>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: 1,
                            bgcolor: isSelected
                              ? alpha(themeColor, 0.04)
                              : alpha(theme.palette.background.default, 0.4),
                            border: '1px solid',
                            borderColor: isSelected ? alpha(themeColor, 0.5) : 'divider',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: alpha(themeColor, 0.8),
                              bgcolor: alpha(themeColor, 0.08)
                            }
                          }}
                        >
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {perm.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {perm.description || 'Allow access to this permission'}
                            </Typography>
                          </Box>
                          <Switch
                            checked={isSelected}
                            onChange={() => handleToggle(perm.id!)}
                            size='small'
                            disabled={!!role.isImmutable}
                          />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            );
          })}
        </Grid>

        {/* Loading Indicator / Intersection Target */}
        <Box
          ref={loadMoreRef}
          sx={{
            mt: 4,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            opacity: hasNextPage ? 1 : 0
          }}
        >
          {isFetchingNextPage && <CircularProgress size={24} />}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RolePermissionsDetail;
