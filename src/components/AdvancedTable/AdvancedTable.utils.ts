import { type CSSProperties, type ReactNode } from 'react';

import type { Column, ColumnDef, SortingState, OnChangeFn } from '@tanstack/react-table';

// Type Imports
import type { FieldConfig } from '@/components/dsl-query-builder/types';

// ============================================================
// TYPES
// ============================================================

export interface AdvancedTableProps<TData> {

  /** Data to display in the table */
  data: TData[];

  /**
   * Field configurations - auto-generates columns from these
   * Use this for simple tables where you don't need custom column definitions
   */
  fields?: FieldConfig<TData>[];

  /**
   * Column definitions from TanStack Table
   * Use this when you need full control over column rendering
   * If both fields and columns are provided, columns takes precedence
   */
  columns?: ColumnDef<TData, unknown>[];

  /** Total number of records (for server-side pagination) */
  total: number;

  /** Current page (1-indexed) */
  page: number;

  /** Page size */
  pageSize: number;

  /** Sorting state */
  sorting?: SortingState;

  /** Callback when page changes */
  onPageChange: (page: number) => void;

  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void;

  /** Callback when sorting changes */
  onSortingChange?: OnChangeFn<SortingState>;

  /** Row selection callback */
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Enable row selection */
  enableRowSelection?: boolean;

  /** Get unique row ID */
  getRowId?: (row: TData) => string;

  /** Custom header content (left side) */
  headerLeftContent?: ReactNode;

  /** Custom header content (right side) */
  headerRightContent?: ReactNode;

  /** Card title */
  title?: string;

  /** Page size options */
  pageSizeOptions?: number[];

  /** Enable index column (Số thứ tự) */
  enableIndexColumn?: boolean;
}

// ============================================================
// HELPERS
// ============================================================

export const getCommonPinningStyles = (column: Column<any>): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px gray inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? 'var(--mui-palette-background-paper)' : undefined
  };
};

export const createDragGhost = (target: HTMLElement) => {
  const clone = target.cloneNode(true) as HTMLElement;
  const rect = target.getBoundingClientRect();

  clone.style.position = 'absolute';
  clone.style.top = '-9999px';
  clone.style.left = '-9999px';
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.backgroundColor = 'var(--mui-palette-background-paper)';
  clone.style.boxShadow = 'var(--mui-shadows-3)';
  clone.style.zIndex = '9999';
  clone.style.listStyle = 'none';
  clone.style.display = 'flex';
  clone.style.alignItems = 'center';

  // Copy padding to ensure text alignment matches
  const computedStyle = window.getComputedStyle(target);

  clone.style.padding = computedStyle.padding;

  document.body.appendChild(clone);

  return clone;
};

export const customColumnOrder = (draggedColumnId: string, targetColumnId: string, order: string[]) => {
  order.splice(order.indexOf(targetColumnId), 0, order.splice(order.indexOf(draggedColumnId), 1)[0] as string);

  return [...order];
};
