'use client';

// React Imports
import { useState, useMemo, useEffect } from 'react';

// MUI Imports
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Checkbox from '@mui/material/Checkbox';

// Third-party Imports
import type {
  ColumnDef,
  VisibilityState,
  ColumnPinningState,
  RowSelectionState,
  TableOptions,
  RowData,
  ColumnOrderState
} from '@tanstack/react-table';
import { useReactTable, createColumnHelper, getCoreRowModel } from '@tanstack/react-table';

// Module augmentation for ColumnMeta
declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
    width?: number | string;
  }
}

// Local Imports
import { AdvancedTableToolbar } from './AdvancedTableToolbar';
import { AdvancedTableHeader } from './AdvancedTableHeader';
import { AdvancedTableBody } from './AdvancedTableBody';
import type { AdvancedTableProps } from './AdvancedTable.utils';

// Type Imports
import type { FieldConfig } from '@/components/dsl-query-builder/types';

// Style Imports
import tableStyles from '@core/styles/table.module.css';

// Constants
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants/pagination';

// ============================================================
// HELPER COMPONENTS
// ============================================================

interface TablePaginationProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
  total: number;
  onPageChange: (page: number) => void;
}

function TablePagination<TData>({ table, total, onPageChange }: TablePaginationProps<TData>) {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>
        {`Showing ${total === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
        to ${Math.min(
          (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
          total
        )} of ${total} entries`}
      </Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={pageCount}
        page={currentPage}
        onChange={(_, page) => {
          onPageChange(page);
        }}
        showFirstButton
        showLastButton
      />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * Generates TanStack Table columns from FieldConfig array
 */
function generateColumnsFromFields<TData>(
  fields: FieldConfig<TData>[],
  columnHelper: ReturnType<typeof createColumnHelper<TData>>
): ColumnDef<TData, unknown>[] {
  return fields
    .filter(field => !field.hidden)
    .map(field => {
      return columnHelper.accessor(row => (row as Record<string, unknown>)[field.key], {
        id: field.key,
        header: field.name,
        enableSorting: !!field.enableSorting, // Default false
        cell: ({ row }) => {
          const value = (row.original as Record<string, unknown>)[field.key];

          // Use custom renderer if provided
          if (field.renderCell) {
            return field.renderCell(value, row.original);
          }

          // Default rendering based on data type
          if (field.dataType === 'date') {
            return (
              <Typography color='text.primary'>
                {typeof value === 'string' || typeof value === 'number' || value instanceof Date
                  ? new Date(value as string | number | Date).toLocaleDateString()
                  : '-'}
              </Typography>
            );
          }

          if (field.dataType === 'bool') {
            return (
              <Typography color='text.primary'>{value === true ? 'Yes' : value === false ? 'No' : '-'}</Typography>
            );
          }

          // Default text rendering
          return <Typography color='text.primary'>{(value as string | number | null) ?? '-'}</Typography>;
        },
        meta: {
          align: field.align,
          width: field.width
        }
      });
    });
}

export function AdvancedTable<TData>({
  data,
  fields,
  columns: userColumns,
  total,
  page,
  pageSize,
  sorting = [],
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onRowSelectionChange,
  isLoading,
  enableRowSelection = false,
  getRowId,
  headerLeftContent,
  headerRightContent,
  title,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  enableIndexColumn = false
}: AdvancedTableProps<TData>) {
  // ============================================================
  // Generate columns from fields if provided
  // ============================================================
  const columnHelper = useMemo(() => createColumnHelper<TData>(), []);

  const generatedColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    // If userColumns provided, use them directly
    if (userColumns && userColumns.length > 0) {
      return userColumns;
    }

    // If fields provided, generate columns from them
    if (fields && fields.length > 0) {
      return generateColumnsFromFields(fields, columnHelper);
    }

    // No columns or fields provided
    return [];
  }, [userColumns, fields, columnHelper]);

  // ============================================================
  // Build columns with optional selection column
  // ============================================================
  const columns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const finalColumns = [...generatedColumns];

    // Prepend selection column if enabled
    if (enableRowSelection) {
      const selectionColumn: ColumnDef<TData, unknown> = {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            color='primary'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            color='primary'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
        meta: {
          align: 'center',
          width: 50
        }
      };

      finalColumns.unshift(selectionColumn);
    }

    // Prepend index column if enabled
    if (enableIndexColumn) {
      const indexColumn: ColumnDef<TData, unknown> = {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <Typography color='text.primary' variant='body2'>
            {(page - 1) * pageSize + row.index + 1}
          </Typography>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
        meta: {
          align: 'center',
          width: 50
        }
      };

      finalColumns.unshift(indexColumn);
    }

    return finalColumns;
  }, [enableRowSelection, enableIndexColumn, generatedColumns, page, pageSize]);

  // ============================================================
  // State
  // ============================================================
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: []
  });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columns.map(column => column.id as string) // Initialize with current columns
  );

  // Sync columnOrder when columns change, but only if IDs are different
  useEffect(() => {
    const newOrder = columns.map(column => column.id as string);

    setColumnOrder(prev => {
      if (prev.length === newOrder.length && prev.every((id, i) => id === newOrder[i])) {
        return prev;
      }

      return newOrder;
    });
  }, [columns]);

  // ============================================================
  // Table configuration
  // ============================================================
  const tableOptions: TableOptions<TData> = {
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize
      },
      sorting,
      columnVisibility,
      columnPinning,
      rowSelection,
      columnOrder
    },
    onColumnOrderChange: setColumnOrder,
    enableRowSelection,
    getRowId: getRowId,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: page - 1,
          pageSize
        });

        onPageChange(newState.pageIndex + 1);
        onPageSizeChange(newState.pageSize);
      } else {
        onPageChange(updater.pageIndex + 1);
        onPageSizeChange(updater.pageSize);
      }
    },
    onSortingChange: onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: updater => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;

      setRowSelection(newSelection);

      // Call external callback with selected rows
      if (onRowSelectionChange) {
        const selectedRows = data.filter((_, index) => {
          const rowId = getRowId ? getRowId(data[index] as TData) : String(index);

          return newSelection[rowId];
        });

        onRowSelectionChange(selectedRows);
      }
    },
    getCoreRowModel: getCoreRowModel()
  };

  const table = useReactTable(tableOptions);

  // ============================================================
  // Render
  // ============================================================
  return (
    <Card>
      <AdvancedTableToolbar
        title={title}
        headerLeftContent={headerLeftContent}
        headerRightContent={headerRightContent}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        table={table}
        setColumnOrder={setColumnOrder}
      />

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <AdvancedTableHeader table={table} setColumnOrder={setColumnOrder} />

          <AdvancedTableBody
            table={table}
            isLoading={isLoading}
            data={data}
            columns={columns}
            pageSize={pageSize}
            enableRowSelection={enableRowSelection}
          />
        </table>
      </div>

      <TablePagination table={table} total={total} onPageChange={onPageChange} />
    </Card>
  );
}
