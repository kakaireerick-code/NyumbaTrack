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

  if (r === 'property_owner') {
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
        headline: 'ULTT-style spreadsheet import',
        detail:
          'Upload Excel .xlsx, CSV, or Word saved as Plain Text. Map columns, preview rows, then confirm. If import fails, add buildings, units, and tenants manually — you can keep working without a spreadsheet.',
        nextSteps: [
          'Download the expanded template',
          'Upload and adjust column mapping',
          'If import fails: Quick add tenant on a unit, or add buildings/units by hand',
        ],
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
        headline: 'Ask anything about Nyumba-track',
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
    if (pageId === 'about') {
      return {
        variant: 'info',
        headline: 'Built for Uganda landlords',
        detail: 'Nyumba-track keeps rent, tenants, and MoMo payments in one place. Tenants and caretakers get their own simple portals.',
        nextSteps: ['Read how roles stay private', 'Partner Rewards is in the header and Discover strip'],
      }
    }
    if (pageId === 'referrals') {
      return {
        variant: 'success',
        headline: 'Partner Rewards',
        detail: 'Share your personal link. Each referred owner earns you 15% billing credit on first login (max 45%).',
        nextSteps: ['Copy your referral link', 'Find Rewards in the header or Discover strip', 'Track banked months on Plans & Billing'],
      }
    }
    if (pageId === 'subscription') {
      return {
        variant: 'neutral',
        headline: 'Plans for property owners only',
        detail: 'Tenants join free. Pick monthly or yearly billing — Partner Rewards discounts stack when you refer others.',
        nextSteps: ['Compare plans below', 'Pay via MoMo then enter your reference', 'Open Partner Rewards for your invite link'],
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
    if (pageId === 'my-dashboard' || pageId === 'my-balance') {
      return {
        variant: 'info',
        headline: 'Your tenant dashboard',
        detail: 'See your rent standing, payment habits, and tips — based on your unit only. No other tenants are visible.',
        nextSteps: ['Check your tenant score', 'Pay rent from quick actions', 'Message your landlord with questions'],
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
    if (pageId === 'about') {
      return {
        variant: 'info',
        headline: 'Your tenant portal',
        detail: 'Your landlord invited you to see your rent, lease, and messages — not other tenants or owner finances.',
        nextSteps: ['Check Home for what you owe', 'Use Messages for rent questions', 'Open Help if something looks wrong'],
      }
    }
  }

  if (r === 'caretaker') {
    if (pageId === 'about') {
      return {
        variant: 'info',
        headline: 'Caretaker view only',
        detail: 'You help with units, vacancy, and repairs. Rent amounts and owner balances are hidden from your role.',
        nextSteps: ['Log maintenance when tenants call', 'Check vacancy before showings', 'Use Help if access looks wrong'],
      }
    }
  }

  if (r === 'caretaker' && pageId === 'maintenance') {
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
