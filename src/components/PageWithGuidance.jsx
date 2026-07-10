import React from 'react'
import GuidancePanel from './GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'

/** Wraps page content with contextual ULTT guidance panel */
export default function PageWithGuidance({ role, pageId, context, children, onGuidanceAction }) {
  const guidance = getPageGuidance(role, pageId, context)
  return (
    <>
      <GuidancePanel guidance={guidance} onAction={onGuidanceAction} />
      {children}
    </>
  )
}
