'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { Grid, Box } from '@mui/material';
import { toast } from 'react-toastify';

import RoleList from './_components/RoleList';
import RolePermissionsDetail from './_components/RolePermissionsDetail';
import RoleDialog from './_components/RoleDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useGetRoles, useDeleteRolesId } from '@/generated/identity-api';
import type { RoleDto } from '@/generated/identity-api';

const RolesPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlRoleId = searchParams.get('id');

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(urlRoleId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null);

  // Helper to create query string
  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      return params.toString();
    },
    [searchParams]
  );

  // Sync state with URL
  useEffect(() => {
    if (urlRoleId !== selectedRoleId) {
      setSelectedRoleId(urlRoleId);
    }
  }, [urlRoleId, selectedRoleId]);

  const handleSelectRole = (id: string | null) => {
    const queryString = createQueryString('id', id);

    router.push(`${pathname}?${queryString}`, { scroll: false });
    setSelectedRoleId(id);
  };

  const {
    data: rolesResponse,
    isLoading: isLoadingRoles,
    refetch: refetchRoles
  } = useGetRoles({
    view: 'detail'
  });

  const roles = useMemo(() => (rolesResponse?.success ? rolesResponse.result?.items || [] : []), [rolesResponse]);

  const selectedRole = useMemo(() => {
    return roles.find(role => role.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Set initial selected role if none selected and data is loaded
  // REMOVED as per user request (no default selection)
  // useEffect(() => {
  //   if (!selectedRoleId && roles.length > 0) {
  //     setSelectedRoleId(roles[0].id!)
  //   }
  // }, [selectedRoleId, roles])

  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRolesId({
    mutation: {
      onSuccess: data => {
        if (data.success) {
          toast.success('Role deleted successfully');
          refetchRoles();
          setIsDeleteDialogOpen(false);
          setRoleToDelete(null);

          // If deleted role was selected, clear selection
          if (selectedRoleId === roleToDelete?.id) {
            handleSelectRole(null);
          }
        } else if (data.errors) {
          data.errors.forEach(e => toast.error(e.message));
        } else {
          toast.error(data.message || 'Failed to delete role');
        }
      }
    }
  });

  const handleAddClick = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (role: RoleDto) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (role: RoleDto) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (roleToDelete?.id) {
      deleteRole({ id: roleToDelete.id });
    }
  };

  const handleDialogSuccess = () => {
    refetchRoles();
  };

  return (
    <Box sx={{ p: { xs: 0, md: 2 }, height: '100%' }}>
      <Grid container spacing={4} sx={{ height: '100%', minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Column: Role List */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <RoleList
            roles={roles}
            selectedRoleId={selectedRoleId}
            onSelectRole={handleSelectRole}
            onAddClick={handleAddClick}
            onEditRole={handleEditClick}
            onDeleteRole={handleDeleteClick}
            isLoading={isLoadingRoles}
          />
        </Grid>

        {/* Right Column: Permission Details */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <RolePermissionsDetail role={selectedRole} isLoading={!selectedRole && isLoadingRoles} />
        </Grid>
      </Grid>

      <RoleDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        role={editingRole}
        onSuccess={handleDialogSuccess}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title='Delete Role'
        content={`Are you sure you want to delete role "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        color='error'
        loading={isDeleting}
      />
    </Box>
  );
};

export default RolesPage;
