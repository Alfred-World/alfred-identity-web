'use client';

import { useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { object, string, minLength, pipe, optional, boolean } from 'valibot';
import { toast } from 'react-toastify';

import { usePostRoles, usePutRolesId } from '@/generated/identity-api';
import type { RoleDto } from '@/generated/identity-api';

import RoleIconPicker from './RoleIconPicker';

interface RoleDialogProps {
  open: boolean;
  onClose: () => void;
  role?: RoleDto | null;
  onSuccess?: () => void;
}

const CustomCloseButton = styled(IconButton)(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
}));

const schema = object({
  name: pipe(string(), minLength(1, 'Role name is required')),
  icon: optional(string()),
  isImmutable: optional(boolean()),
  isSystem: optional(boolean())
});

type FormData = {
  name: string;
  icon?: string;
  isImmutable?: boolean;
  isSystem?: boolean;
};

const RoleDialog = ({ open, onClose, role, onSuccess }: RoleDialogProps) => {
  const isEdit = !!role;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      icon: '',
      isImmutable: false,
      isSystem: false
    },
    resolver: valibotResolver(schema)
  });

  // Reset form when opening/closing or changing role
  useEffect(() => {
    if (open) {
      reset({
        name: role?.name || '',
        icon: role?.icon || '',
        isImmutable: role?.isImmutable || false,
        isSystem: role?.isSystem || false
      });
    }
  }, [open, role, reset]);

  const { mutate: createRole, isPending: isCreating } = usePostRoles({
    mutation: {
      onSuccess: data => {
        if (data.success) {
          toast.success('Role created successfully');
          handleClose();
          onSuccess?.();
        } else {
          toast.error(data.errors?.[0]?.message || 'Failed to create role');
        }
      }
    }
  });

  const { mutate: updateRole, isPending: isUpdating } = usePutRolesId({
    mutation: {
      onSuccess: data => {
        if (data.success) {
          toast.success('Role updated successfully');
          handleClose();
          onSuccess?.();
        } else {
          toast.error(data.errors?.[0]?.message || 'Failed to update role');
        }
      }
    }
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: FormData) => {
    if (isEdit && role?.id) {
      updateRole({
        id: role.id,
        data: {
          name: data.name,
          icon: data.icon,
          isImmutable: data.isImmutable,
          isSystem: data.isSystem,
          id: role.id
        }
      });
    } else {
      createRole({
        data: {
          name: data.name,
          icon: data.icon,
          isImmutable: data.isImmutable,
          isSystem: data.isSystem
        }
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth='sm'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle variant='h4' sx={{ textAlign: 'center', p: 5 }}>
        {isEdit ? 'Edit Role' : 'Add New Role'}
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          {isEdit ? 'Update the details of the existing role.' : 'Create a new role to assign permissions.'}
        </Typography>
      </DialogTitle>

      <CustomCloseButton aria-label='close' onClick={handleClose}>
        <i className='tabler-x' />
      </CustomCloseButton>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ p: 5 }}>
          <Box sx={{ mb: 4 }}>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Role Name'
                  placeholder='e.g. Administrator'
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <Controller
              name='icon'
              control={control}
              render={({ field: { value, onChange } }) => (
                <RoleIconPicker
                  value={value || ''}
                  onChange={onChange}
                  error={!!errors.icon}
                  helperText={errors.icon?.message}
                />
              )}
            />
          </Box>
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name='isImmutable'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label='Immutable (Cannot be deleted or modified)'
                />
              )}
            />
            <Controller
              name='isSystem'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label='System Role'
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 5, pt: 0, justifyContent: 'center' }}>
          <Button variant='outlined' color='secondary' onClick={handleClose} sx={{ mr: 2 }}>
            Discard
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color='inherit' /> : null}
          >
            {isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RoleDialog;
