import type { PageId } from './permissions'
import { normalizeRole } from './permissions'
import { APP_NAME } from './brand'

export type HighlightIcon =
  | 'trial'
  | 'free'
  | 'uganda'
  | 'momo'
  | 'referral'
  | 'privacy'
  | 'yearly'
  | 'invite'

export type ProductHighlight = {
  id: string
  title: string
  detail: string
  pageId?: PageId
  ctaLabel?: string
  icon: HighlightIcon
  roles: Array<'property_owner' | 'tenant' | 'caretaker'>
  surfaces: Array<'discover' | 'dashboard' | 'help' | 'login' | 'about' | 'tenant-home'>
}

/** Crucial product facts — surfaced in header, dashboard, help, and login (not buried in Settings) */
export const PRODUCT_HIGHLIGHTS: ProductHighlight[] = [
  {
    id: 'free-trial',
    title: '14-day free trial',
    detail: 'Full access for new owners. Sign in with Google — no MoMo payment to start.',
    pageId: 'subscription',
    ctaLabel: 'See plans',
    icon: 'trial',
    roles: ['property_owner'],
    surfaces: ['discover', 'dashboard', 'help', 'login', 'about'],
  },
  {
    id: 'tenant-free',
    title: 'Tenants never pay',
    detail: 'Your tenants join free via invite link. Only property owners subscribe.',
    pageId: 'about',
    ctaLabel: 'Learn more',
    icon: 'free',
    roles: ['property_owner'],
    surfaces: ['discover', 'dashboard', 'help', 'login', 'about'],
  },
  {
    id: 'tenant-portal-free',
    title: 'Your portal is free',
    detail: `${APP_NAME} never charges tenants. You only see your unit, rent, and messages.`,
    pageId: 'about',
    ctaLabel: 'About this app',
    icon: 'free',
    roles: ['tenant'],
    surfaces: ['discover', 'help', 'about', 'tenant-home'],
  },
  {
    id: 'built-uganda',
    title: 'Built for Uganda',
    detail: 'UGX amounts, MTN MoMo, Airtel Money, LC1 notices, and local rent workflows.',
    icon: 'uganda',
    roles: ['property_owner', 'tenant', 'caretaker'],
    surfaces: ['discover', 'dashboard', 'help', 'about'],
  },
  {
    id: 'yearly-save',
    title: 'Yearly saves 2 months',
    detail: 'Pay for 10 months upfront and get 12 months of access on any plan.',
    pageId: 'subscription',
    ctaLabel: 'Compare plans',
    icon: 'yearly',
    roles: ['property_owner'],
    surfaces: ['discover', 'dashboard', 'help', 'login', 'about'],
  },
  {
    id: 'partner-rewards',
    title: 'Partner Rewards',
    detail: 'Refer another landlord — earn 15% billing credit per first login (max 45%).',
    pageId: 'referrals',
    ctaLabel: 'Get your link',
    icon: 'referral',
    roles: ['property_owner'],
    surfaces: ['discover', 'dashboard', 'help', 'about'],
  },
  {
    id: 'private-roles',
    title: 'Private by role',
    detail: 'Tenants, caretakers, and owners each see only what they need — no cross-tenant data.',
    pageId: 'about',
    ctaLabel: 'How it works',
    icon: 'privacy',
    roles: ['property_owner', 'tenant', 'caretaker'],
    surfaces: ['discover', 'dashboard', 'help', 'about'],
  },
  {
    id: 'stable-invites',
    title: 'Stable tenant links',
    detail: 'Invite links stay valid until you regenerate them or a tenant joins. Great for WhatsApp sharing.',
    pageId: 'units',
    ctaLabel: 'Invite tenants',
    icon: 'invite',
    roles: ['property_owner'],
    surfaces: ['dashboard', 'help', 'about'],
  },
  {
    id: 'momo-billing',
    title: 'Pay via MTN MoMo',
    detail: `Subscribe to ${APP_NAME} at 0793068911. Tenants pay rent to your building MoMo in Settings.`,
    pageId: 'subscription',
    ctaLabel: 'Plans & Billing',
    icon: 'momo',
    roles: ['property_owner'],
    surfaces: ['discover', 'help', 'about'],
  },
  {
    id: 'caretaker-scope',
    title: 'Caretaker view only',
    detail: 'Caretakers see units and repairs — not rent amounts or owner balances.',
    pageId: 'about',
    ctaLabel: 'About access',
    icon: 'privacy',
    roles: ['caretaker'],
    surfaces: ['discover', 'help', 'about'],
  },
  {
    id: 'tenant-momo',
    title: 'Pay rent via MoMo',
    detail: 'Your landlord MoMo numbers are on Home. Use Payments → I paid after sending.',
    pageId: 'my-payments',
    ctaLabel: 'Go to Pay',
    icon: 'momo',
    roles: ['tenant'],
    surfaces: ['discover', 'help', 'tenant-home'],
  },
]

export const highlightsFor = (
  role: string,
  surface: ProductHighlight['surfaces'][number],
): ProductHighlight[] => {
  const normalized = normalizeRole(role)
  return PRODUCT_HIGHLIGHTS.filter(
    (h) =>
      h.surfaces.includes(surface) &&
      h.roles.includes(normalized as ProductHighlight['roles'][number]),
  )
}
