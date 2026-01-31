'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'

const PAGE_SIZE = 400

interface RoleIconPickerProps {
  value: string
  onChange: (icon: string) => void
  error?: boolean
  helperText?: string
}

const RoleIconPicker = ({ value, onChange, error, helperText }: RoleIconPickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [allIcons, setAllIcons] = useState<string[]>([])

  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Fetch icons on mount
  useEffect(() => {
    fetch('/icons.json')
      .then(res => res.json())
      .then(data => setAllIcons(data))
      .catch(err => console.error('Failed to load icons:', err))
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setVisibleCount(PAGE_SIZE)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setSearchTerm('')
  }

  const handleSelect = (icon: string) => {
    onChange(icon)
    handleClose()
  }

  // Filter icons based on search term
  const filteredIcons = useMemo(() => {
    if (!searchTerm) return allIcons
    const term = searchTerm.toLowerCase()

    return allIcons.filter(icon => icon.toLowerCase().includes(term))
  }, [searchTerm, allIcons])

  // Get current slice of visible icons
  const visibleIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount)
  }, [filteredIcons, visibleCount])

  // Callback ref for the sentinel
  const sentinelRef = useCallback(
    (node: HTMLDivElement) => {
      if (!node) return

      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            // Use functional update to ensure we don't depend on stale closures
            setVisibleCount(prev => prev + PAGE_SIZE)
          }
        },
        {
          root: scrollContainer,
          rootMargin: '300px'
        }
      )

      observerRef.current.observe(node)
    },
    [scrollContainer]
  ) // Re-attach when container becomes available

  const open = Boolean(anchorEl)

  return (
    <Box>
      <TextField
        fullWidth
        label='Role Icon'
        placeholder='Select an icon'
        value={value}
        onClick={handleClick}
        error={error}
        helperText={helperText}
        InputProps={{
          readOnly: true,
          startAdornment: value ? (
            <InputAdornment position='start'>
              <i className={`${value} text-xl`} />
            </InputAdornment>
          ) : null,
          endAdornment: (
            <InputAdornment position='end'>
              <i className='tabler-chevron-down' />
            </InputAdornment>
          ),
          sx: { cursor: 'pointer' }
        }}
        sx={{
          '& .MuiInputBase-root': { cursor: 'pointer' },
          '& input': { cursor: 'pointer' }
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            width: 620,
            p: 2,
            maxHeight: 500,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Typography variant='subtitle2' sx={{ mb: 1.5, fontWeight: 600 }}>
          Select Icon ({filteredIcons.length})
        </Typography>

        <TextField
          size='small'
          placeholder='Search icons...'
          fullWidth
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='tabler-search' />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position='end' sx={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')}>
                <i className='tabler-x' />
              </InputAdornment>
            )
          }}
        />

        <Box
          ref={setScrollContainer}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 1,
            overflowY: 'auto',
            maxHeight: 350,
            p: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          {visibleIcons.map(icon => (
            <Button
              key={icon}
              variant={value === icon ? 'contained' : 'text'}
              onClick={() => handleSelect(icon)}
              title={icon}
              sx={{
                minWidth: 40,
                height: 40,
                p: 0,
                borderRadius: 1,
                bgcolor: value === icon ? 'primary.main' : 'transparent',
                color: value === icon ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: value === icon ? 'primary.dark' : 'action.hover'
                },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <i className={`${icon} text-xl`} />
            </Button>
          ))}

          {visibleIcons.length < filteredIcons.length && (
            <Box
              ref={sentinelRef}
              sx={{
                gridColumn: 'span 8',
                display: 'flex',
                justifyContent: 'center',
                py: 2
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}

          {filteredIcons.length === 0 && (
            <Box sx={{ gridColumn: 'span 8', textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant='body2'>No icons found</Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  )
}

export default RoleIconPicker
