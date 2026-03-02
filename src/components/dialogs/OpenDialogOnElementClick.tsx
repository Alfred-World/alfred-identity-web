'use client'

import { useState } from 'react'
import type { ElementType } from 'react'

type Props = {
  element: ElementType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elementProps?: any
  dialog: ElementType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dialogProps?: any
}

const OpenDialogOnElementClick = ({ element: Element, elementProps, dialog: Dialog, dialogProps }: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Element {...elementProps} onClick={() => setOpen(true)} />
      <Dialog open={open} setOpen={setOpen} {...dialogProps} />
    </>
  )
}

export default OpenDialogOnElementClick
