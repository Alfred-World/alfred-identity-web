'use client';

// React Imports
import { type DragEvent, type Dispatch, type SetStateAction } from 'react';

// MUI Imports
import { styled } from '@mui/material/styles';

// Third-party Imports
import classnames from 'classnames';
import { flexRender, type Table, type ColumnOrderState } from '@tanstack/react-table';

// Local Imports
import { getCommonPinningStyles, createDragGhost, customColumnOrder } from './AdvancedTable.utils';

// Styled Components
const Icon = styled('i')({});

interface AdvancedTableHeaderProps<TData> {
  table: Table<TData>;
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>;
}

export function AdvancedTableHeader<TData>({ table, setColumnOrder }: AdvancedTableHeaderProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th key={header.id} style={{ ...getCommonPinningStyles(header.column) }}>
              {header.isPlaceholder ? null : (
                <div
                  className={classnames('flex items-center w-full', {
                    'cursor-pointer select-none': header.column.getCanSort(),
                    'justify-start':
                      header.column.columnDef.meta?.align === 'left' || !header.column.columnDef.meta?.align,
                    'justify-center': header.column.columnDef.meta?.align === 'center',
                    'justify-end': header.column.columnDef.meta?.align === 'right'
                  })}
                  draggable={!header.column.getIsPinned()}
                  onDragStart={(e: DragEvent<HTMLDivElement>) => {
                    e.dataTransfer.setData('text/plain', header.column.id);

                    // Set custom drag ghost (using the TH element)
                    const thElement = (e.currentTarget as HTMLElement).closest('th');

                    if (thElement) {
                      const ghost = createDragGhost(thElement);

                      e.dataTransfer.setDragImage(ghost, 0, 0);

                      // Remove ghost after drag starts
                      setTimeout(() => {
                        if (document.body.contains(ghost)) {
                          document.body.removeChild(ghost);
                        }
                      }, 0);
                    }
                  }}
                  onDragOver={(e: DragEvent<HTMLTableCellElement>) => {
                    e.preventDefault();
                  }}
                  onDrop={(e: DragEvent<HTMLTableCellElement>) => {
                    e.preventDefault();
                    const draggedColumnId = e.dataTransfer.getData('text/plain');
                    const targetColumnId = header.column.id;

                    if (draggedColumnId && targetColumnId && draggedColumnId !== targetColumnId) {
                      setColumnOrder(prev => customColumnOrder(draggedColumnId, targetColumnId, [...prev]));
                    }
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className='flex items-center gap-2'>
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    {header.column.getCanSort() && (
                      <span className='flex items-center'>
                        {{
                          asc: <Icon className='tabler-chevron-up text-lg' />,
                          desc: <Icon className='tabler-chevron-down text-lg' />
                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? (
                          <Icon className='tabler-selector text-lg opacity-50' />
                        )}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}
