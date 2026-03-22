'use client';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { email, minLength, object, optional, pipe, string } from 'valibot';
import { toast } from 'react-toastify';

import { customFetch } from '@/libs/custom-instance';
import type { UserDtoApiResponse } from '@/generated/identity-api';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
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
  fullName: pipe(string(), minLength(1, 'Full name is required')),
  email: pipe(string(), email('Please enter a valid email address')),
  userName: optional(string()),
  password: pipe(string(), minLength(8, 'Password must be at least 8 characters'))
});

type FormData = {
  fullName: string;
  email: string;
  userName?: string;
  password: string;
};

const AddUserDialog = ({ open, onClose, onSuccess }: AddUserDialogProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      fullName: '',
      email: '',
      userName: '',
      password: ''
    },
    resolver: valibotResolver(schema)
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: '',
        email: '',
        userName: '',
        password: ''
      });
    }
  }, [open, reset]);

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      return customFetch<UserDtoApiResponse>('/identity/mgmt/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          userName: data.userName || null,
          password: data.password,
          roleIds: null
        })
      });
    },
    onSuccess: data => {
      if (data.success) {
        toast.success('User created successfully');
        onSuccess?.();
        onClose();

        return;
      }

      toast.error(data.errors?.[0]?.message || 'Failed to create user');
    },
    onError: () => {
      toast.error('Failed to create user');
    }
  });

  const onSubmit = (data: FormData) => {
    createUser(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm' sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogTitle variant='h4' sx={{ textAlign: 'center', p: 5 }}>
        Add New User
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Create a new user account for identity admin management.
        </Typography>
      </DialogTitle>

      <CustomCloseButton aria-label='close' onClick={onClose}>
        <i className='tabler-x' />
      </CustomCloseButton>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ p: 5 }}>
          <Box sx={{ mb: 4 }}>
            <Controller
              name='fullName'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Full Name'
                  placeholder='e.g. John Doe'
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              )}
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Email'
                  placeholder='john@company.com'
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <Controller
              name='userName'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Username (optional)'
                  placeholder='john.doe'
                  error={!!errors.userName}
                  helperText={errors.userName?.message || 'Leave empty to use email as username'}
                />
              )}
            />
          </Box>
          <Box>
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type='password'
                  label='Password'
                  placeholder='Minimum 8 characters'
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 5, pt: 0, justifyContent: 'center' }}>
          <Button variant='outlined' color='secondary' onClick={onClose} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={20} color='inherit' /> : null}
          >
            Create User
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddUserDialog;
