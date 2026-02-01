'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { object, string, maxLength, pipe, nonEmpty, array, minLength } from 'valibot';
import type { InferInput } from 'valibot';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
  Chip,
  Autocomplete,
  Paper,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';

import type { ApplicationDto } from '@/generated';
import {
  useGetApplicationsMetadata,
  usePatchApplicationsIdStatus,
  usePostApplicationsIdSecretRegenerate
} from '@/generated';
import { useBreadcrumbs } from '@/contexts/BreadcrumbsContext';
import { ROUTES } from '@/configs/routes';

export interface ApplicationFormSubmitData {
  clientId: string;
  displayName: string;
  type: string;
  clientType: string;
  redirectUris: string;
  postLogoutRedirectUris: string;
  permissions: string;
}

interface ApplicationFormProps {
  initialData?: ApplicationDto;
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit: (data: ApplicationFormSubmitData) => Promise<ApplicationDto | void> | void;
}

export const ApplicationForm = ({ initialData, isEdit = false, isLoading = false, onSubmit }: ApplicationFormProps) => {
  const router = useRouter();
  const [_showSecret, _setShowSecret] = useState(false);

  // New State for features
  const [isActive, setIsActive] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [openSecretModal, setOpenSecretModal] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Helper for custom confirmation
  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, onConfirm });
  };

  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { title: 'Dashboards', href: ROUTES.DASHBOARDS.ROOT },
      { title: 'Applications', href: ROUTES.APPLICATIONS.LIST },
      { title: isEdit ? 'Edit Application' : 'Create Application' }
    ]);
  }, [isEdit, setBreadcrumbs]);

  // Generated API Hooks
  const { mutateAsync: updateStatus } = usePatchApplicationsIdStatus();
  const { mutateAsync: regenerateSecret } = usePostApplicationsIdSecretRegenerate();

  // Fetch metadata from API
  const { data: resp } = useGetApplicationsMetadata();
  const metadata = resp?.success ? resp.result : undefined;

  // Form definition
  const schema = useMemo(() => {
    return object({
      clientId: pipe(string(), nonEmpty('Client ID is required'), maxLength(100, 'Max length 100')),
      displayName: pipe(string(), nonEmpty('Display Name is required'), maxLength(200, 'Max length 200')),
      type: pipe(string(), nonEmpty('Application Type is required')),
      clientType: pipe(string(), nonEmpty('Client Type is required')),
      redirectUris: pipe(array(string()), minLength(1, 'At least one Redirect URI is required')),
      postLogoutRedirectUris: array(string()),
      scopes: pipe(array(string()), minLength(1, 'At least one Scope/Permission is required')) // This will hold all gt:, scp:, ept: tags
    });
  }, []);

  type FormData = InferInput<typeof schema>;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      clientId: `app_${Math.random().toString(36).substring(2, 10)}`,
      displayName: '',
      type: 'web',
      clientType: 'confidential',
      redirectUris: [],
      postLogoutRedirectUris: [],
      scopes: ['openid', 'profile'] // Initial default scopes
    }
  });

  // Synchronization with initialData for Edit mode
  useEffect(() => {
    if (initialData) {
      setValue('clientId', initialData.clientId || '');
      setValue('displayName', initialData.displayName || '');
      setValue('type', initialData.applicationType || 'web');
      setValue('clientType', initialData.clientType || 'confidential');
      setValue('redirectUris', initialData.redirectUris || []);
      setValue('postLogoutRedirectUris', initialData.postLogoutRedirectUris || []);

      const permissions = initialData.permissions || [];

      // Normalize permissions: keep the prefix (gt:, scp:, ept:) if it exists, otherwise assume scp: or just keep as is
      setValue('scopes', permissions);

      setIsActive(initialData.isActive ?? true);
    }
  }, [initialData, setValue]);

  const selectedScopes = watch('scopes');

  const handleFormSubmit = async (data: FormData) => {
    // Transform arrays back to strings for the API
    // Ensure all scopes have a prefix if they don't already
    const processedPermissions = data.scopes.map((s: string) => {
      if (s.startsWith('scp:') || s.startsWith('gt:') || s.startsWith('ept:')) return s;

      return `scp:${s}`; // Default to scp: for custom/unprefixed ones
    });

    const submissionData = {
      ...data,
      redirectUris: data.redirectUris.join(','),
      postLogoutRedirectUris: data.postLogoutRedirectUris.join(','),
      permissions: processedPermissions.join(' ')
    };

    const result = await onSubmit(submissionData);

    if (result && result.clientSecret) {
      setNewSecret(result.clientSecret);
      setOpenSecretModal(true);
      setCopiedSecret(false);
    } else if (!isEdit) {
      // If creating and no secret returned (public client), redirect immediately
      if (result) {
        router.push(ROUTES.APPLICATIONS.LIST);
      }
    }
  };

  const handleCopyClientId = () => {
    const clientId = watch('clientId');

    navigator.clipboard.writeText(clientId);
  };

  const handleToggleScope = (scope: string) => {
    const current = [...selectedScopes];

    if (current.includes(scope)) {
      setValue(
        'scopes',
        current.filter(s => s !== scope)
      );
    } else {
      setValue('scopes', [...current, scope]);
    }
  };

  // --- New Handlers ---

  const handleToggleStatus = async () => {
    if (!initialData?.id) return;

    try {
      setIsTogglingStatus(true);
      const newStatus = !isActive;

      // Call API using generated hook
      await updateStatus({
        id: initialData.id,
        data: { isActive: newStatus }
      });

      setIsActive(newStatus);
      toast.success(`Application ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Failed to update application status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleRegenerateSecret = async () => {
    const id = initialData?.id;

    if (!id) return;

    requestConfirm(
      'Regenerate Client Secret',
      'Are you sure you want to regenerate the client secret? This will invalidate the current secret immediately and applications using it will lose access.',
      async () => {
        try {
          setIsRegenerating(true);

          // Call API using generated hook
          const result = await regenerateSecret({
            id
          });

          if (result?.success) {
            setNewSecret(result.result || '');
            setOpenSecretModal(true);
            setCopiedSecret(false);
            toast.success('Secret regenerated successfully');
          } else {
            toast.error('Failed to regenerate secret');
          }
        } catch (error) {
          console.error('Failed to regenerate secret', error);
          toast.error('Failed to regenerate secret');
        } finally {
          setIsRegenerating(false);
        }
      }
    );
  };

  const handleCloseSecretModal = () => {
    const close = () => {
      setOpenSecretModal(false);
      setNewSecret('');

      // If we are in 'create' mode, redirect after closing the modal
      if (!isEdit) {
        router.push(ROUTES.APPLICATIONS.LIST);
      }
    };

    if (!copiedSecret) {
      requestConfirm(
        'Secret Not Copied',
        "You haven't copied the new secret yet. You won't be able to see it again after closing this window. Are you sure you want to close?",
        close
      );
    } else {
      close();
    }
  };

  const sectionHeader = (title: string, icon: string, color: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          boxShadow: `0 0 10px ${alpha(color, 0.5)}`
        }}
      >
        <i className={icon} style={{ color: 'white', fontSize: 18 }} />
      </Box>
      <Typography variant='h6' fontWeight='600' sx={{ color: 'text.primary' }}>
        {title}
      </Typography>
    </Box>
  );

  const renderChipGroup = (title: string, items: string[], prefix: string, activeColor: string) => {
    if (!items || items.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='body2'
          sx={{
            mb: 2,
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {items.map((item: string) => {
            const label = item.replace(`${prefix}:`, '');
            const isSelected = selectedScopes.includes(item) || selectedScopes.includes(label);

            return (
              <Chip
                key={item}
                label={label}
                onClick={() => handleToggleScope(item)}
                icon={isSelected ? <i className='tabler-check' style={{ fontSize: 16 }} /> : undefined}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={_theme => ({
                  borderRadius: 2,
                  px: 0.5,
                  py: 0.5,
                  transition: 'all 0.2s',
                  ...(isSelected
                    ? {
                        bgcolor: activeColor,
                        color: 'white',
                        borderColor: activeColor,
                        '& .MuiChip-icon': { color: 'white' },
                        '&:hover': { bgcolor: alpha(activeColor, 0.8) }
                      }
                    : {
                        borderColor: 'divider',
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'action.hover', borderColor: activeColor }
                      })
                })}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<i className='tabler-chevron-left' />}
          onClick={() => router.push(ROUTES.APPLICATIONS.LIST)}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            mb: 1,
            p: 0,
            '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
          }}
        >
          Back
        </Button>
        <Typography variant='h4' fontWeight='bold' sx={{ mb: 1 }}>
          {isEdit ? 'Edit Application' : 'Create New Application'}
        </Typography>
      </Box>

      <Card
        sx={{
          borderRadius: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: 4
        }}
      >
        <CardContent sx={{ p: { xs: 4, md: 6 } }}>
          {/* General Information Section */}
          <Box sx={{ mb: 8 }}>
            {sectionHeader('General Information', 'tabler-info-circle', '#00CFE8')}

            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name='displayName'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Display Name'
                      placeholder='e.g. My Application'
                      error={!!errors.displayName}
                      helperText={errors.displayName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name='clientId'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Client ID'
                      disabled={isEdit}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton onClick={handleCopyClientId} edge='end' size='small'>
                              <i className='tabler-copy' />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Configuration Section */}
          <Box sx={{ mb: 8 }}>
            {sectionHeader('Configuration', 'tabler-settings', '#28C76F')}

            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Application Type</InputLabel>
                  <Controller
                    name='type'
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label='Application Type'>
                        {(metadata?.applicationTypes || ['web', 'native', 'machine', 'spa']).map((type: string) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Application
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Client Type</InputLabel>
                  <Controller
                    name='clientType'
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label='Client Type'>
                        {(metadata?.clientTypes || ['confidential', 'public']).map((type: string) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth disabled>
                  <InputLabel>Consent Type</InputLabel>
                  <Select value='explicit' label='Consent Type'>
                    <MenuItem value='explicit'>Explicit Consent</MenuItem>
                    <MenuItem value='implicit'>Implicit Consent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Redirect Configuration Section */}
          <Box sx={{ mb: 8 }}>
            {sectionHeader('Redirect Configuration', 'tabler-link', '#FF9F43')}

            <Grid container spacing={5}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name='redirectUris'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={field.value}
                      autoSelect
                      onChange={(_, newValue) => field.onChange(newValue as string[])}
                      renderTags={(value: string[], getTagProps) =>
                        value.map((option: string, index: number) => {
                          const { key, ...tagProps } = getTagProps({ index });

                          return (
                            <Chip
                              key={key}
                              label={option}
                              {...tagProps}
                              size='small'
                              variant='filled'
                              sx={{
                                bgcolor: alpha('#7367F0', 0.12),
                                color: '#7367F0',
                                borderRadius: 1
                              }}
                            />
                          );
                        })
                      }
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Redirect URIs'
                          placeholder='Add URI...'
                          error={!!errors.redirectUris}
                          helperText={
                            errors.redirectUris?.message ||
                            'Callbacks after authentication. Enter a valid URI and press Enter.'
                          }
                          slotProps={{
                            formHelperText: {
                              sx: { mt: 2 }
                            }
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name='postLogoutRedirectUris'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={field.value}
                      autoSelect
                      onChange={(_, newValue) => field.onChange(newValue as string[])}
                      renderValue={(value: string[], getTagProps) =>
                        value.map((option: string, index: number) => {
                          const { key, ...tagProps } = getTagProps({ index });

                          return (
                            <Chip
                              key={key}
                              label={option}
                              {...tagProps}
                              size='small'
                              variant='filled'
                              sx={{ borderRadius: 1 }}
                            />
                          );
                        })
                      }
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Post Logout Redirect URIs'
                          placeholder='Add URI...'
                          helperText='Redirects after sign out.'
                          slotProps={{
                            formHelperText: {
                              sx: { mt: 2 }
                            }
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Scopes & Permissions Section */}
          <Box sx={{ mb: 4 }}>
            {sectionHeader('Scopes & Permissions', 'tabler-key', '#7367F0')}

            <Paper
              elevation={0}
              variant='outlined'
              sx={{
                p: 4,
                bgcolor: 'action.hover',
                borderRadius: 2,
                borderStyle: 'dashed',
                borderColor: 'divider'
              }}
            >
              {/* OIDC Scopes */}
              {renderChipGroup('OIDC Scopes', metadata?.scopes || [], 'scp', '#14b8a6')}

              {/* Grant Types */}
              {renderChipGroup('Grant Types', metadata?.grantTypes || [], 'gt', '#FF9F43')}

              {/* Endpoints */}
              {renderChipGroup('Endpoints', metadata?.endpoints || [], 'ept', '#00CFE8')}
            </Paper>
          </Box>

          {/* Form Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 6,
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            {/* Left Side: Danger Zone / Status */}
            {isEdit && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <LoadingButton
                  variant='outlined'
                  color={isActive ? 'error' : 'success'}
                  onClick={handleToggleStatus}
                  loading={isTogglingStatus}
                  startIcon={<i className={isActive ? 'tabler-ban' : 'tabler-check'} />}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </LoadingButton>

                <LoadingButton
                  variant='outlined'
                  color='warning'
                  onClick={handleRegenerateSecret}
                  loading={isRegenerating}
                  startIcon={<i className='tabler-refresh' />}
                >
                  Regenerate Secret
                </LoadingButton>
              </Box>
            )}

            {/* Right Side: Navigation & Submit */}
            <Box sx={{ display: 'flex', gap: 3, ml: 'auto' }}>
              <Button
                variant='text'
                onClick={() => router.push(ROUTES.APPLICATIONS.LIST)}
                sx={{ color: 'text.secondary', fontWeight: 600, px: 4 }}
              >
                Cancel
              </Button>
              <LoadingButton
                type='submit'
                variant='contained'
                loading={isLoading}
                startIcon={<i className='tabler-device-floppy' />}
                sx={{
                  bgcolor: '#14b8a6',
                  '&:hover': { bgcolor: '#0d9488' },
                  px: 6,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: `0 4px 14px 0 ${alpha('#14b8a6', 0.39)}`
                }}
              >
                {isEdit ? 'Update Application' : 'Create Application'}
              </LoadingButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Secret Regeneration Modal */}
      <Dialog
        open={openSecretModal}
        onClose={() => {}} // Disable backdrop click
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className='tabler-alert-triangle text-warning' />
          New Client Secret
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This is your new Client Secret. Please copy and store it securely.
            <strong> It will not be shown again.</strong>
          </DialogContentText>

          <Box
            sx={{
              p: 3,
              bgcolor: 'action.hover',
              borderRadius: 2,
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              wordBreak: 'break-all',
              position: 'relative',
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            {newSecret}
            <Tooltip title={copiedSecret ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(newSecret);
                  setCopiedSecret(true);
                  toast.success('Copied to clipboard');
                }}
                sx={{ position: 'absolute', top: 8, right: 8 }}
                color={copiedSecret ? 'success' : 'default'}
              >
                <i className={copiedSecret ? 'tabler-check' : 'tabler-copy'} />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant='contained'
            onClick={handleCloseSecretModal}
            color={copiedSecret ? 'success' : 'primary'}
            disabled={!copiedSecret} // Force copy
          >
            {copiedSecret ? 'I have saved it' : 'Copy to continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmState.open}
        onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
        maxWidth='xs'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{confirmState.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>{confirmState.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ gap: 2, pb: 2, px: 3 }}>
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => setConfirmState(prev => ({ ...prev, open: false }))}
            sx={{ borderRadius: 2, px: 4 }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              setConfirmState(prev => ({ ...prev, open: false }));
              confirmState.onConfirm();
            }}
            sx={{
              borderRadius: 2,
              px: 4,
              bgcolor: '#7367F0',
              '&:hover': { bgcolor: '#665dd8' }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
};
