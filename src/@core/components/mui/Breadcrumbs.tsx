'use client'

import Link from 'next/link'

import { Breadcrumbs, Typography, Link as MuiLink, Box } from '@mui/material'

import { useBreadcrumbs } from '@/contexts/BreadcrumbsContext'

const AppBreadcrumbs = () => {
  const { breadcrumbs } = useBreadcrumbs()

  if (!breadcrumbs || breadcrumbs.length === 0) return null

  return (
    <Box sx={{ mb: 4, mt: -2 }}>
      <Breadcrumbs
        aria-label='breadcrumb'
        separator={<i className='tabler-chevron-right text-[14px]' />}
        sx={{
          '& .MuiBreadcrumbs-li': {
            display: 'flex',
            alignItems: 'center'
          }
        }}
      >
        <MuiLink
          component={Link}
          href='/'
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' }
          }}
        >
          <i className='tabler-smart-home mr-1 text-[20px]' />
        </MuiLink>

        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          if (isLast || !item.href) {
            return (
              <Typography key={index} variant='body1' sx={{ color: 'text.primary', fontWeight: 500 }}>
                {item.title}
              </Typography>
            )
          }

          return (
            <MuiLink
              key={index}
              component={Link}
              href={item.href}
              variant='body1'
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {item.title}
            </MuiLink>
          )
        })}
      </Breadcrumbs>
    </Box>
  )
}

export default AppBreadcrumbs
