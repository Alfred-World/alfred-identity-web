'use client';

// React Imports
import { useState, type ReactNode, type DragEvent, type Dispatch, type SetStateAction } from 'react';

// MUI Imports
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

// Component Imports
import type { Table, ColumnOrderState } from '@tanstack/react-table';

import CustomTextField from '@core/components/mui/TextField';

// Third-party Imports

// Utils
import { createDragGhost, customColumnOrder } from './AdvancedTable.utils';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants/pagination';

// Styled Components
const Icon = styled('i')({});

interface AdvancedTableToolbarProps<TData> {
  title?: string;
  headerLeftContent?: ReactNode;
  headerRightContent?: ReactNode;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  table: Table<TData>;
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>;
}

export function AdvancedTableToolbar<TData>({
  title,
  headerLeftContent,
  headerRightContent,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  table,
  setColumnOrder
}: AdvancedTableToolbarProps<TData>) {
  // Menu anchor for column visibility dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
      {/* Left side content */}
      <div className='flex items-center gap-4'>
        {title && (
          <Typography variant='h6' fontWeight={600}>
            {title}
          </Typography>
        )}
        {headerLeftContent}
        <div className='flex items-center gap-2'>
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className='max-sm:is-full sm:is-[80px]'
          >
            {pageSizeOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </CustomTextField>
        </div>
      </div>

      {/* Right side content */}
      <div className='flex items-center gap-2'>
        {headerRightContent}

        {/* Column Visibility Toggle Button */}
        <Button
          variant='outlined'
          size='small'
          onClick={handleMenuClick}
          startIcon={<Icon className='tabler-columns' />}
          sx={{ minWidth: 'auto' }}
        >
          View
        </Button>

        {/* Column Visibility Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          slotProps={{
            paper: {
              sx: { minWidth: 200, maxHeight: 400 }
            }
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              Table View
            </Typography>
          </Box>
          <Divider />

          {/* Column Visibility Header */}
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', fontWeight: 500 }}>
              Column Visibility
            </Typography>
          </Box>

          {/* Column Toggles */}
          {table.getAllLeafColumns().map(column => {
            // Skip selection column
            if (column.id === 'select') return null;

            const isPinnedLeft = column.getIsPinned() === 'left';
            const isPinnedRight = column.getIsPinned() === 'right';
            const isPinned = isPinnedLeft || isPinnedRight;

            return (
              <MenuItem
                key={column.id}
                sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onDragOver={(e: DragEvent<HTMLLIElement>) => {
                  e.preventDefault();
                }}
                onDrop={(e: DragEvent<HTMLLIElement>) => {
                  e.preventDefault();
                  const draggedColumnId = e.dataTransfer.getData('text/plain');
                  const targetColumnId = column.id;

                  if (draggedColumnId && targetColumnId && draggedColumnId !== targetColumnId) {
                    setColumnOrder(prev => customColumnOrder(draggedColumnId, targetColumnId, [...prev]));
                  }
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={column.getIsVisible()}
                      onChange={e => {
                        e.stopPropagation();
                        column.toggleVisibility(e.target.checked);
                      }}
                      size='small'
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={
                    <Typography variant='body2'>
                      {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                    </Typography>
                  }
                  sx={{ m: 0, flex: 1 }}
                  onClick={e => e.stopPropagation()}
                />

                {/* Pin/Unpin Buttons */}
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1, alignItems: 'center' }}>
                  {isPinned ? (
                    <Tooltip title='Unpin'>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation();
                          column.pin(false);
                        }}
                        sx={{ p: 0.25 }}
                      >
                        <Icon className='tabler-x text-lg' />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip title='Pin Left'>
                        <IconButton
                          size='small'
                          onClick={e => {
                            e.stopPropagation();
                            column.pin('left');
                          }}
                          sx={{ p: 0.25 }}
                        >
                          <Icon className='tabler-arrow-bar-to-left text-lg' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Pin Right'>
                        <IconButton
                          size='small'
                          onClick={e => {
                            e.stopPropagation();
                            column.pin('right');
                          }}
                          sx={{ p: 0.25 }}
                        >
                          <Icon className='tabler-arrow-bar-to-right text-lg' />
                        </IconButton>
                      </Tooltip>
                      {/* Drag Handle */}
                      <span
                        draggable={!isPinned}
                        onDragStart={(e: DragEvent<HTMLSpanElement>) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', column.id);

                          // Set drag image to a custom ghost of the entire row
                          const rowElement = (e.currentTarget as HTMLElement).closest('li');

                          if (rowElement) {
                            const ghost = createDragGhost(rowElement);

                            e.dataTransfer.setDragImage(ghost, 0, 0);

                            // Remove the ghost element after the drag starts
                            setTimeout(() => {
                              if (document.body.contains(ghost)) {
                                document.body.removeChild(ghost);
                              }
                            }, 0);
                          }
                        }}
                        style={{ cursor: isPinned ? 'default' : 'move', display: 'flex', alignItems: 'center' }}
                      >
                        <Icon className='tabler-grip-vertical text-lg opacity-50 ml-1' />
                      </span>
                    </>
                  )}
                </Box>
              </MenuItem>
            );
          })}

          {/* Show All Columns - Only show if some columns are hidden */}
          {!table.getIsAllColumnsVisible() && <Divider sx={{ my: 1 }} />}
          {!table.getIsAllColumnsVisible() && (
            <MenuItem
              onClick={() => {
                table.toggleAllColumnsVisible(true);
              }}
              sx={{ justifyContent: 'center', gap: 2 }}
            >
              <Icon className='tabler-eye text-lg' />
              <Typography variant='body2' color='primary'>
                Show All Columns
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </div>
    </CardContent>
  );
}
