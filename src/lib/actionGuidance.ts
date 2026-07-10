import { normalizeRole } from './permissions'

export type Guidance = {
  variant: 'success' | 'info' | 'warning' | 'neutral'
  headline: string
  detail: string
  nextSteps: string[]
}

export const getPageGuidance = (
  role: string,
  pageId: string,
  ctx: Record<string, unknown> = {},
): Guidance | null => {
  const r = normalizeRole(role)
  const buildings = (ctx.buildings as unknown[]) || []
  const units = (ctx.units as unknown[]) || []
  const tenants = (ctx.tenants as unknown[]) || []
  const demoMode = !!ctx.demoMode

  if (r === 'property_owner' || r === 'accountant') {
    if (pageId === 'dashboard' && buildings.length === 0 && units.length === 0) {
      return {
        variant: 'info',
        headline: 'Start simple',
        detail: 'Start with one property and one tenant — no spreadsheet needed. Use Quick add on any unit.',
        nextSteps: ['Add a property', 'Add one unit with rent', 'Quick add tenant or share invite code'],
      }
    }
    if (pageId === 'data-import') {
      if (buildings.length === 0) {
        return {
          variant: 'warning',
          headline: 'Add a property first',
          detail: 'Import needs at least one property to match rows. Or let import create properties from your sheet.',
          nextSteps: ['Add a building manually', 'Or upload — we create properties from property_name column'],
        }
      }
      return {
        variant: 'info',
        headline: 'Already keep tenants in Excel?',
        detail: 'Upload your sheet — we match columns for you. Save as CSV from Excel or Google Sheets.',
        nextSteps: ['Download the sample template', 'Upload your CSV', 'Review the preview before confirming'],
      }
    }
    if (pageId === 'tenants') {
      return {
        variant: 'neutral',
        headline: 'All your tenants in one place',
        detail: 'Filter by how they were added: manual, spreadsheet, or PDF agreement.',
        nextSteps: ['Click a row for full details', 'Attach PDF agreements from Documents tab'],
      }
    }
    if (pageId === 'buildings' && buildings.length === 0) {
      return {
        variant: 'info',
        headline: 'Add your first property',
        detail: 'Each building or compound is a separate property. You can add multiple units inside each one.',
        nextSteps: ['Click Add Building', 'Enter name and address', 'Then go to Units to add rentable spaces'],
      }
    }
    if (pageId === 'units' && units.length === 0) {
      return {
        variant: 'warning',
        headline: 'No units yet',
        detail: 'Add at least one unit before inviting a tenant. A shop and a flat are separate units with their own rent.',
        nextSteps: ['Click Add Unit', 'Set monthly rent and due day', 'Generate invite code for vacant units'],
      }
    }
    if (pageId === 'buildings') {
      return {
        variant: 'info',
        headline: 'One property, many units',
        detail: 'Add each rentable unit separately — ground shop and Flat 2B can have different rent amounts.',
        nextSteps: ['Click a property card to view its units', 'Use owner notes (Owner only) for private reminders'],
      }
    }
    if (pageId === 'payments' && tenants.length === 0) {
      return {
        variant: 'warning',
        headline: 'Assign a tenant first',
        detail: 'You cannot record rent payments until a tenant is linked to a unit.',
        nextSteps: ['Go to Units and share an invite code', 'Or use Quick add tenant on a vacant unit'],
      }
    }
    if (pageId === 'balance-tracker') {
      return {
        variant: 'neutral',
        headline: 'Who owes rent',
        detail: 'This list is private — tenants cannot see other tenants or portfolio totals.',
        nextSteps: ['Send reminders from the Reminders page', 'Export defaulters for follow-up'],
      }
    }
    if (pageId === 'guided') {
      return {
        variant: 'success',
        headline: 'Step-by-step guides',
        detail: 'Follow these workflows at your own pace. Each step takes you to the right page.',
        nextSteps: ['Start with "Add a property" if you are new', 'Use "Invite a tenant" when a unit is ready'],
      }
    }
    if (pageId === 'assistant') {
      return {
        variant: 'info',
        headline: 'Ask anything about NyumbaTrack',
        detail: 'Type a question like "How do I add a unit?" or "What can tenants see?"',
        nextSteps: ['Try the suggested questions below', 'Open Help for the full manual'],
      }
    }
    if (pageId === 'messages') {
      return {
        variant: 'info',
        headline: 'Messages from tenants',
        detail: 'Tenants can contact you about rent or lease questions. Reply here — they never see your other properties.',
        nextSteps: ['Unread messages show in the header badge', 'Click a thread to reply'],
      }
    }
    if (demoMode) {
      return {
        variant: 'warning',
        headline: 'Training mode is on',
        detail: 'You are viewing sample data. Turn off Demo Mode in the header to work with your real properties.',
        nextSteps: ['Explore freely — nothing affects live data', 'Toggle Demo Mode off when ready'],
      }
    }
  }

  if (r === 'tenant') {
    if (pageId === 'my-balance') {
      return {
        variant: 'info',
        headline: 'What you owe',
        detail: 'This shows your rent for your unit only. Other tenants and owner records are never visible to you.',
        nextSteps: ['Pay using the MoMo numbers shown', 'Tap Payments to tell your landlord you paid'],
      }
    }
    if (pageId === 'my-payments') {
      return {
        variant: 'info',
        headline: 'Your payment history',
        detail: 'This shows what you owe for your unit only. Tap Help if the amount looks wrong.',
        nextSteps: ['Use "I paid" after sending MoMo', 'Download receipts when available'],
      }
    }
    if (pageId === 'my-lease') {
      return {
        variant: 'neutral',
        headline: 'Your lease details',
        detail: 'Your landlord set these dates. Contact them to change rent or discuss move-out.',
        nextSteps: ['Read house rules below', 'Call the caretaker number for repairs'],
      }
    }
    if (pageId === 'help' || pageId === 'assistant') {
      return {
        variant: 'success',
        headline: 'We are here to help',
        detail: 'Everything in this app is about your unit only. You never need to call the developer.',
        nextSteps: ['Read the FAQ', 'Ask the assistant a question', 'Restart the tour from Help'],
      }
    }
  }

  if (r === 'housekeeper' && pageId === 'maintenance') {
    return {
      variant: 'info',
      headline: 'Log and update repairs',
      detail: 'Report issues tenants raise and mark them resolved when done. Financial data is hidden from your role.',
      nextSteps: ['Click Log Issue', 'Update status when the repair is fixed'],
    }
  }

  return null
}

export const getBlockedActionMessage = (action: string, reason: string, next: string): string =>
  `You can't ${action} — ${reason} ${next}`
