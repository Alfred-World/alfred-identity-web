'use client'

import { useState } from 'react'

import {
  Box,
  Card,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Chip,
  Skeleton,
  alpha,
  useTheme,
  IconButton
} from '@mui/material'

import type { RoleDto } from '@/generated/identity-api'

interface RoleListProps {
  roles: RoleDto[]
  selectedRoleId: string | null
  onSelectRole: (id: string) => void
  onAddClick: () => void
  onEditRole: (role: RoleDto) => void
  onDeleteRole: (role: RoleDto) => void
  isLoading?: boolean
}

const RoleList = ({
  roles,
  selectedRoleId,
  onSelectRole,
  onAddClick,
  onEditRole,
  onDeleteRole,
  isLoading
}: RoleListProps) => {
  const [search, setSearch] = useState('')
  const theme = useTheme()

  const filteredRoles = roles.filter(role => role.name?.toLowerCase().includes(search.toLowerCase()))

  const getRoleIcon = (role: RoleDto) => {
    if (role.icon) return role.icon

    return 'tabler-user'
  }

  const getAccessDescription = (roleName: string = '') => {
    const name = roleName.toLowerCase()

    if (name.includes('admin')) return 'Full Access'
    if (name.includes('editor')) return 'Limited Access'
    if (name.includes('support')) return 'User Management'

    return 'Read-only'
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h5' fontWeight={600}>
            Roles
          </Typography>
          <Chip
            label={`${roles.length} Total`}
            size='small'
            variant='tonal'
            color='secondary'
            sx={{ fontWeight: 500 }}
          />
        </Box>

        <TextField
          fullWidth
          size='small'
          placeholder='Search roles...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search text-secondary' />
                </InputAdornment>
              )
            }
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {isLoading ? (
          <List>
            {[1, 2, 3, 4].map(i => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton variant='rounded' height={70} />
              </Box>
            ))}
          </List>
        ) : (
          <List component='nav' sx={{ p: 0 }}>
            {filteredRoles.map(role => {
              const isSelected = role.id === selectedRoleId
              const icon = getRoleIcon(role)
              const accessType = getAccessDescription(role.name || '')

              return (
                <ListItemButton
                  key={role.id}
                  selected={isSelected}
                  onClick={() => onSelectRole(role.id!)}
                  sx={{
                    mb: 2,
                    borderRadius: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.16)
                      }
                    },
                    transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow']),
                    '&:hover .actions': { opacity: 1 }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? 'primary.main' : 'text.secondary',
                      bgcolor: isSelected
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.secondary.main, 0.05),
                      p: 1.5,
                      borderRadius: 1,
                      mr: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <i className={icon} style={{ fontSize: '1.25rem' }} />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Typography
                        variant='body1'
                        fontWeight={isSelected ? 600 : 500}
                        color={isSelected ? 'primary.main' : 'text.primary'}
                      >
                        {role.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant='caption' color='text.secondary'>
                        {accessType}
                      </Typography>
                    }
                  />

                  <Box
                    className='actions'
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      opacity: isSelected ? 1 : 0,
                      transition: 'opacity 0.2s'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => onEditRole(role)}
                      disabled={!!role.isImmutable}
                    >
                      <i className='tabler-edit' />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => onDeleteRole(role)}
                      disabled={!!role.isImmutable}
                    >
                      <i className='tabler-trash' />
                    </IconButton>
                  </Box>
                </ListItemButton>
              )
            })}
          </List>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 4 }}>
        <Button
          fullWidth
          variant='outlined'
          startIcon={<i className='tabler-plus' />}
          sx={{ py: 2, borderRadius: 1 }}
          onClick={onAddClick}
        >
          Add New Role
        </Button>
      </Box>
    </Card>
  )
}

export default RoleList
