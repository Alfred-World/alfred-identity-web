import type { ChildrenType } from '@core/types'

// No longer need GuestOnlyRoute here - the logic is in page.tsx
const Layout = async (props: ChildrenType) => {
  const { children } = props

  return <>{children}</>
}

export default Layout
