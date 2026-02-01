'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  loading?: boolean;
}

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  color = 'primary',
  loading = false
}: ConfirmationDialogProps) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      sx={{ '& .MuiDialog-paper': { width: '100%', maxWidth: 450 } }}
    >
      <DialogTitle id='alert-dialog-title' sx={{ fontSize: '1.25rem' }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description' sx={{ color: 'text.secondary' }}>
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button variant='outlined' color='secondary' onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant='contained'
          onClick={onConfirm}
          color={color}
          autoFocus
          disabled={loading}
          sx={{
            boxShadow: theme.shadows[2],
            ...(color === 'error' && {
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark', boxShadow: `0 0 10px ${alpha(theme.palette.error.main, 0.4)}` }
            })
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
