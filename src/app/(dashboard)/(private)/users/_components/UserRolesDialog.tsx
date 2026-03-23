'use client';

import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import type { RoleDto } from '@/generated/identity-api';

type UserRolesDialogProps = {
  open: boolean;
  userDisplayName: string;
  roles: RoleDto[];
  initialRoleIds: string[];
  isLoadingRoles: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (selectedRoleIds: string[]) => Promise<void>;
};

const UserRolesDialog = ({
  open,
  userDisplayName,
  roles,
  initialRoleIds,
  isLoadingRoles,
  isSaving,
  onClose,
  onSave
}: UserRolesDialogProps) => {
  const theme = useTheme();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedRoleIds(initialRoleIds);
  }, [initialRoleIds, open]);

  const selectableRoles = useMemo(() => {
    return roles.filter(role => !!role.id);
  }, [roles]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => (prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]));
  };

  const handleSave = async () => {
    await onSave(selectedRoleIds);
  };

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth='md' fullWidth>
      <DialogTitle component='div'>
        <Typography variant='h5'>Assign Roles</Typography>
        <Typography variant='body2' color='text.secondary'>
          Manage roles for {userDisplayName}.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isLoadingRoles ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {selectableRoles.map(role => {
              const roleId = role.id as string;
              const isSelected = selectedRoleIds.includes(roleId);

              return (
                <Grid size={{ xs: 12, sm: 6 }} key={roleId}>
                  <Card
                    onClick={() => handleToggleRole(roleId)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.background.default, 0.35),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 1,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.12)
                            : alpha(theme.palette.secondary.main, 0.06)
                        }}
                      >
                        <i className={role.icon || 'ri-shield-user-line'} style={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant='subtitle2' fontWeight={600}>
                          {role.name || 'Unknown role'}
                        </Typography>
                        {role.isSystem && (
                          <Typography variant='caption' color='info.main'>
                            System Core
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <Switch
                      checked={isSelected}
                      onChange={() => handleToggleRole(roleId)}
                      onClick={event => event.stopPropagation()}
                      size='small'
                    />
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant='outlined' color='secondary' disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          disabled={isSaving || isLoadingRoles}
          onClick={() => {
            void handleSave();
          }}
          startIcon={isSaving ? <CircularProgress size={18} color='inherit' /> : <i className='ri-save-line' />}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRolesDialog;
