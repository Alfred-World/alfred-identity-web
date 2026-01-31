'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useState, useCallback } from 'react'

export interface BreadcrumbItem {
  title: string
  href?: string
}

interface BreadcrumbsContextType {
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (items: BreadcrumbItem[]) => void
}

const BreadcrumbsContext = createContext<BreadcrumbsContextType | undefined>(undefined)

export const BreadcrumbsProvider = ({ children }: { children: ReactNode }) => {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([])

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items)
  }, [])

  return <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>{children}</BreadcrumbsContext.Provider>
}

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbsContext)

  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbsProvider')
  }

  return context
}
