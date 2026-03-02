'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Third-party Imports
import { toast } from 'react-toastify'

// Core Imports
import CustomIconButton from '@core/components/mui/IconButton'

type SocialAccountsType = {
  title: string
  logo: string
  description: string
  isConnected: boolean
}

const socialAccountsArr: SocialAccountsType[] = [
  {
    title: 'Google',
    description: 'Connect your Google account',
    isConnected: false,
    logo: '/images/logos/google.png'
  },
  {
    title: 'GitHub',
    description: 'Connect your GitHub account',
    isConnected: true,
    logo: '/images/logos/github.png'
  },
  {
    title: 'Facebook',
    description: 'Connect your Facebook profile',
    isConnected: false,
    logo: '/images/logos/facebook.png'
  },
]

const Connections = () => {
  const handleConnect = (provider: string) => {
    toast.info(`The connection feature for ${provider} is currently under development.`)
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <Box>
          <Typography variant='h5' className='font-bold mb-1'>Social Connections</Typography>
          <Typography color='text.secondary'>
            Manage your linked social accounts to enable Single Sign-On (SSO) and personalize your platform experience.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {socialAccountsArr.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'fadeSlideUp 0.5s ease-out forwards',
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  transform: 'translateY(20px)',
                  '@keyframes fadeSlideUp': {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                  },
                  transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: (theme) => `0 4px 18px 0 ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent className='flex flex-col h-full gap-4'>
                  <div className='flex items-center justify-between'>
                    <div className='p-2 rounded-lg bg-action-hover'>
                      <img height={24} width={24} src={item.logo} alt={item.title} className='object-contain' />
                    </div>
                    {item.isConnected ? (
                      <Chip label='CONNECTED' size='small' color='success' variant='tonal' sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    ) : (
                      <Chip label='DISCONNECTED' size='small' color='secondary' variant='tonal' sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    )}
                  </div>

                  <div className='flex flex-col flex-grow gap-2 mt-2'>
                    <Typography variant='h6' className='font-semibold'>{item.title}</Typography>
                    <Typography variant='body2' color='text.secondary' className='flex-grow'>
                      {item.description}
                    </Typography>
                  </div>

                  <div className='mt-2'>
                    <Button
                      fullWidth
                      variant={item.isConnected ? 'tonal' : 'contained'}
                      color={item.isConnected ? 'secondary' : 'primary'}
                      onClick={() => handleConnect(item.title)}
                      startIcon={<i className={item.isConnected ? 'tabler-link-off' : 'tabler-link'} />}
                      disabled={item.isConnected}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {item.isConnected ? 'Disconnect' : 'Connect Account'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Add Integration Card */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={(theme) => ({
                height: '100%',
                minHeight: 250,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                padding: 4,
                textAlign: 'center',
                cursor: 'pointer',
                animation: 'fadeSlideUp 0.5s ease-out forwards',
                animationDelay: `${socialAccountsArr.length * 0.1}s`,
                opacity: 0,
                transform: 'translateY(20px)',
                transition: 'all 0.3s',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(115,103,240,0.05)' : 'rgba(115,103,240,0.02)',
                  transform: 'translateY(-4px)'
                }
              })}
              onClick={() => handleConnect('Custom Integration')}
            >
              <CustomIconButton size='large' variant='tonal' color='secondary' className='mb-4' sx={{ width: 48, height: 48 }}>
                <i className='tabler-plus text-xl' />
              </CustomIconButton>
              <Typography variant='h6' className='font-semibold mb-2'>Add Integration</Typography>
              <Typography variant='body2' color='text.secondary'>
                Don&apos;t see what you need? Suggest or build a custom integration.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Connections
