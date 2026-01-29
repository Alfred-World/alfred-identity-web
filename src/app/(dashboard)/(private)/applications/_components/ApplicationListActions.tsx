'use client'

import React, { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'

import { toast } from 'react-toastify'

import { useDeleteApplicationsId } from '@/generated'

interface ApplicationListActionsProps {
  id: number
  displayName: string
  onDeleteSuccess?: () => void
}

export const ApplicationListActions = ({ id, displayName, onDeleteSuccess }: ApplicationListActionsProps) => {
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const open = Boolean(anchorEl)

  const { mutate: deleteApplication, isPending } = useDeleteApplicationsId({
    mutation: {
      onSuccess: () => {
        toast.success(`Application "${displayName}" deleted successfully`)
        setIsDeleteDialogOpen(false)
        onDeleteSuccess?.()
      },
      onError: (error) => {
        const message = error.errors[0].message || 'Failed to delete application'
        toast.error(message)
      }
    }
  })

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation() // Prevent row click
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event?: React.MouseEvent) => {
    event?.stopPropagation()
    setAnchorEl(null)
  }

  const handleEdit = () => {
    handleClose()
    router.push(`/applications/${id}`)
  }

  const handleDeleteClick = () => {
    handleClose()
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteApplication({ id })
  }

  const handleCancelDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIsDeleteDialogOpen(false)
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <IconButton
        aria-label="more"
        id={`application-actions-button-${id}`}
        aria-controls={open ? `application-actions-menu-${id}` : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <i className='tabler-dots-vertical text-textSecondary' />
      </IconButton>
      <Menu
        id={`application-actions-menu-${id}`}
        MenuListProps={{
          'aria-labelledby': `application-actions-button-${id}`
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        slotProps={{
          paper: {
            style: {
              width: '20ch'
            }
          }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <i className='tabler-edit text-xl' />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <i className='tabler-trash text-xl text-error' />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Application?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete application <strong>{displayName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
