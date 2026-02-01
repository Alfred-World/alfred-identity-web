'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

import Link from 'next/link';

import { Box, Grid, Typography, Button, Chip } from '@mui/material';

import { DslQueryBuilder, type FieldConfig, type FilterCondition } from '@/components/dsl-query-builder';
import { useUrlPagination, useUrlSorting } from '@/components/UrlPagination';
import { AdvancedTable } from '@/components/AdvancedTable';
import { useGetApplications } from '@/generated';
import type { ApplicationDto } from '@/generated';

import { ApplicationListActions } from './_components/ApplicationListActions';
import { useBreadcrumbs } from '@/contexts/BreadcrumbsContext';
import { ROUTES } from '@/configs/routes';

export default function ApplicationsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ title: 'Dashboards', href: ROUTES.DASHBOARDS.ROOT }, { title: 'Applications' }]);
  }, [setBreadcrumbs]);

  const [appliedQuery, setAppliedQuery] = useState('');

  // Get pagination from URL
  const { page, pageSize, setPage, setPageSize, resetPage } = useUrlPagination();
  const { sort, sorting, setSorting } = useUrlSorting('-createdAt'); // Default sort by newest

  // Fetch applications with the DSL filter and pagination
  const { data, isLoading, error, refetch } = useGetApplications({
    filter: appliedQuery || undefined,
    page,
    pageSize,
    sort
  });

  const result = data?.success ? data.result : null;

  // Field config for Applications - memoized to include refetch in actions
  const applicationFields: FieldConfig<ApplicationDto>[] = useMemo(
    () => [
      {
        name: 'Display Name',
        key: 'displayName',
        dataType: 'string',
        width: 200,
        enableSorting: true,
        renderCell: (value, row) => (
          <Typography
            component={Link}
            href={ROUTES.APPLICATIONS.EDIT(row.id!)}
            color='primary'
            sx={{
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline', color: 'primary.dark' }
            }}
          >
            {value as string}
          </Typography>
        )
      },
      { name: 'Client ID', key: 'clientId', dataType: 'string', width: 250 },
      {
        name: 'Type',
        key: 'applicationType',
        dataType: 'string',
        width: 120,
        renderCell: value => {
          const type = (value as string)?.toLowerCase();
          let color: 'primary' | 'info' | 'success' | 'secondary' | 'default' = 'default';

          if (type?.includes('web')) color = 'primary';
          else if (type?.includes('spa')) color = 'info';
          else if (type?.includes('native')) color = 'success';
          else if (type?.includes('m2m')) color = 'secondary';

          return <Chip label={value as string} size='small' variant='tonal' color={color} sx={{ height: 24 }} />;
        }
      },
      {
        name: 'Client Type',
        key: 'clientType',
        dataType: 'string',
        width: 120,
        renderCell: value => {
          const type = (value as string)?.toLowerCase();
          const color = type === 'confidential' ? 'warning' : 'info';

          return <Chip label={value as string} size='small' variant='tonal' color={color} sx={{ height: 24 }} />;
        }
      },
      {
        name: 'Active',
        key: 'isActive',
        dataType: 'bool',
        width: 100,
        renderCell: value => (
          <Chip
            label={value ? 'Active' : 'Inactive'}
            size='small'
            variant='tonal'
            color={value ? 'success' : 'error'}
            sx={{ height: 24 }}
          />
        )
      },
      { name: 'Permissions', key: 'permissions', dataType: 'string', hidden: true },
      { name: 'Created At', key: 'createdAt', dataType: 'date', enableSorting: true, width: 180 },
      { name: 'Updated At', key: 'updatedAt', dataType: 'date', enableSorting: true, hidden: true },
      {
        name: 'Actions',
        key: 'actions',
        dataType: 'string',
        width: 100,
        renderCell: (_value, row) => (
          <ApplicationListActions
            id={row.id!}
            displayName={row.displayName || 'Unnamed Application'}
            onDeleteSuccess={() => refetch()}
          />
        )
      }
    ],
    [refetch]
  ) as FieldConfig<ApplicationDto>[];

  const handleSearch = useCallback(
    (query: string) => {
      setAppliedQuery(query);
      resetPage(); // Reset to first page on new search
    },
    [resetPage]
  );

  const handleReset = useCallback(() => {
    setAppliedQuery('');
    resetPage();
  }, [resetPage]);

  const handleChange = useCallback((_conditions: FilterCondition[], _query: string) => {
    // Optional: track changes without triggering search
  }, []);

  if (error) {
    return <Typography color='error'>Error loading data: {String(error)}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4'>Applications</Typography>
        <Button
          component={Link}
          href={ROUTES.APPLICATIONS.CREATE}
          variant='contained'
          startIcon={<i className='tabler-plus' />}
        >
          Create Application
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Filter Builder */}
        <Grid size={{ xs: 12 }}>
          <DslQueryBuilder
            fields={applicationFields}
            onChange={handleChange}
            onSearch={handleSearch}
            onReset={handleReset}
            onInitialLoad={handleSearch}
            title='Filter Applications...'
            syncWithUrl={true}
          />
        </Grid>

        {/* Applications Table */}
        <Grid size={{ xs: 12 }}>
          <AdvancedTable<ApplicationDto>
            fields={applicationFields}
            data={result?.items || []}
            total={result?.total || 0}
            page={page}
            pageSize={pageSize}
            sorting={sorting}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortingChange={setSorting}
            isLoading={isLoading}
            enableRowSelection={false}
            enableIndexColumn={true}
            getRowId={row => String(row.id)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
