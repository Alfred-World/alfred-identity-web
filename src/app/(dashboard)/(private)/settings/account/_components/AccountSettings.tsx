'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'

// Tab Content Imports
import AccountTab from './account'
import SecurityTab from './security'
import NotificationsTab from './notifications'
import ConnectionsTab from './connections'

// Vars
const tabData = [
  { label: 'Account', value: 'account', icon: 'tabler-users' },
  { label: 'Security', value: 'security', icon: 'tabler-lock' },
  { label: 'Notifications', value: 'notifications', icon: 'tabler-bell' },
  { label: 'Connections', value: 'connections', icon: 'tabler-link' }
]

const AccountSettings = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  // States
  const [activeTab, setActiveTab] = useState(tabParam || 'account')

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    } else if (!tabParam && activeTab !== 'account') {
      setActiveTab('account')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam])

  const handleChange = (_event: SyntheticEvent, value: string) => {
    setActiveTab(value)
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()))

    currentParams.set('tab', value)
    router.push(`?${currentParams.toString()}`)
  }

  // Vars
  const tabContentList: { [key: string]: ReactElement } = {
    account: <AccountTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
    connections: <ConnectionsTab />
  }

  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
            {tabData.map(tab => (
              <Tab
                key={tab.value}
                label={tab.label}
                icon={<i className={tab.icon} />}
                iconPosition='start'
                value={tab.value}
              />
            ))}
          </CustomTabList>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TabPanel value={activeTab} className='p-0'>
            {tabContentList[activeTab]}
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}

export default AccountSettings
