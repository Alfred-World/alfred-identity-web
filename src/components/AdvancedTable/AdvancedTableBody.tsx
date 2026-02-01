'use client';

// Third-party Imports
import classnames from 'classnames';
import { flexRender, type Table, type ColumnDef } from '@tanstack/react-table';

// Local Component Imports
import { TableSkeleton } from './TableSkeleton';

// Local Imports
import { getCommonPinningStyles } from './AdvancedTable.utils';

interface AdvancedTableBodyProps<TData> {
  table: Table<TData>;
  isLoading?: boolean;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageSize: number;
  enableRowSelection?: boolean;
}

export function AdvancedTableBody<TData>({
  table,
  isLoading,
  data,
  columns,
  pageSize,
  enableRowSelection = false
}: AdvancedTableBodyProps<TData>) {
  if (isLoading) {
    return (
      <TableSkeleton
        rowCount={Math.min(pageSize, 10)}
        columnCount={enableRowSelection ? columns.length - 1 : columns.length}
        showCheckbox={enableRowSelection}
      />
    );
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className='text-center'>
            No data available
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
          {row.getVisibleCells().map(cell => (
            <td
              key={cell.id}
              style={{
                ...getCommonPinningStyles(cell.column),
                textAlign: cell.column.columnDef.meta?.align
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
