'use client';

import type { ReactNode } from 'react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import CustomAvatar from '@core/components/mui/Avatar';
import type { ThemeColor } from '@core/types';

interface UserStatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: ThemeColor;
  trend?: {
    value: number;
    label: string;
  };
  secondaryContent?: ReactNode; // For the avatars on the 4th card
}

const UserStatCard = (props: UserStatCardProps) => {
  const { title, value, icon, color, trend, secondaryContent } = props;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <CustomAvatar skin='light' variant='rounded' color={color} sx={{ width: 42, height: 42 }}>
            <i className={icon} style={{ fontSize: '24px' }} />
          </CustomAvatar>

          {trend && (
            <Chip
              label={`${trend.value > 0 ? '+' : ''}${trend.value}%`}
              color={trend.value > 0 ? 'success' : 'error'}
              variant='tonal'
              size='small'
              icon={
                <i className={trend.value > 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} style={{ fontSize: 14 }} />
              }
              sx={{
                height: 24,
                backgroundColor:
                  trend.value > 0
                    ? 'var(--mui-palette-success-lighterOpacity)'
                    : 'var(--mui-palette-error-lighterOpacity)',
                color: trend.value > 0 ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)',
                '& .MuiChip-label': { px: 1, fontSize: '0.8125rem', fontWeight: 500 }
              }}
            />
          )}

          {secondaryContent && <Box>{secondaryContent}</Box>}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant='body1' color='text.secondary'>
            {title}
          </Typography>
          <Typography variant='h4'>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserStatCard;
