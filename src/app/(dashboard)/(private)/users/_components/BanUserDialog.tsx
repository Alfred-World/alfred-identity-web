'use client';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface BanUserDialogProps {
  open: boolean;
  userDisplayName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; expiresAt?: string }) => void;
}

const BanUserDialog = ({ open, userDisplayName, isSubmitting, onClose, onConfirm }: BanUserDialogProps) => {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setExpiresAt('');
      setError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      setError('Reason is required');

      return;
    }

    onConfirm({
      reason: normalizedReason,
      expiresAt: expiresAt || undefined
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Ban User</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          You are banning {userDisplayName}. This user will be blocked from logging in until unbanned.
        </Typography>

        <Box sx={{ display: 'grid', gap: 4 }}>
          <TextField
            label='Reason'
            value={reason}
            onChange={event => {
              setReason(event.target.value);

              if (error) {
                setError(null);
              }
            }}
            error={!!error}
            helperText={error || 'Provide a clear reason for audit history'}
            fullWidth
            multiline
            minRows={3}
            placeholder='Violation policy, suspicious activity, etc.'
          />

          <TextField
            label='Expires At (optional)'
            type='datetime-local'
            value={expiresAt}
            onChange={event => setExpiresAt(event.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            helperText='Leave empty for indefinite ban'
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' variant='outlined' disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} color='error' variant='contained' disabled={isSubmitting}>
          Ban User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BanUserDialog;
