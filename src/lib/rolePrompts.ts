import { safeGet, safeSet } from './storage'
import { normalizeRole } from './permissions'

export type TourStep = { title: string; description: string; icon: string }

export const TOUR_STORAGE_KEY = (role: string) =>
  `rent_app_tour_v1_${normalizeRole(role)}`

export const isTourComplete = (role: string): boolean =>
  safeGet(TOUR_STORAGE_KEY(role), false) === true

export const markTourComplete = (role: string): void =>
  safeSet(TOUR_STORAGE_KEY(role), true)

export const resetTour = (role: string): void =>
  safeSet(TOUR_STORAGE_KEY(role), false)

const OWNER_STEPS: TourStep[] = [
  { title: 'Welcome, property owner', description: 'NyumbaTrack helps you manage rent, tenants, and payments in one place. This short tour shows you the basics.', icon: 'Home' },
  { title: 'Add your property', description: 'Go to Properties and add each building or compound you rent out.', icon: 'Building2' },
  { title: 'Create units', description: 'Add every rentable space separately — a ground shop and Flat 2B can have different rent.', icon: 'DoorOpen' },
  { title: 'Set rent per unit', description: 'Enter monthly rent and due day for each unit. You can change these anytime.', icon: 'CreditCard' },
  { title: 'Invite tenants', description: 'Share the join link with each tenant — they use it free; only you manage your account.', icon: 'Users' },
  { title: 'Your dashboard', description: 'Track occupancy, collections, and who owes rent — all from the dashboard.', icon: 'LayoutDashboard' },
  { title: 'Need help later?', description: 'Tap My Guide in the header, or open Help / Ask Assistant anytime. You never need to call support for basic tasks.', icon: 'HelpCircle' },
]

const TENANT_STEPS: TourStep[] = [
  { title: 'Welcome to your home', description: 'Your landlord invited you here to see rent and lease details for your unit only.', icon: 'Home' },
  { title: 'What you owe', description: 'The Home tab shows your rent balance and when payment is due — plain and simple.', icon: 'Scale' },
  { title: 'Make a payment', description: 'Use the payment numbers your landlord gave you. You can notify them after you pay.', icon: 'CreditCard' },
  { title: 'Your lease', description: 'View your lease dates, rent amount, and how to contact your landlord.', icon: 'FileText' },
  { title: 'Get help', description: 'Open Help or Ask Assistant if something looks wrong. No jargon — just answers.', icon: 'HelpCircle' },
]

const HOUSEKEEPER_STEPS: TourStep[] = [
  { title: 'Caretaker access', description: 'You can view units, vacancy, maintenance, and tenant contact details — not financial records.', icon: 'Wrench' },
  { title: 'Units & vacancy', description: 'See which units are occupied, vacant, or under repair.', icon: 'DoorOpen' },
  { title: 'Log maintenance', description: 'Report and update repair issues for your assigned properties.', icon: 'Wrench' },
  { title: 'Tenants (view only)', description: 'Look up tenant names and units when they call — you cannot see rent balances.', icon: 'Users' },
]

export const getTourSteps = (role: string): TourStep[] => {
  const r = normalizeRole(role)
  if (r === 'tenant') return TENANT_STEPS
  if (r === 'housekeeper') return HOUSEKEEPER_STEPS
  return OWNER_STEPS
}

export const ROLE_LOGIN_HINTS: Record<string, string> = {
  property_owner: 'Set up properties and units, then share join links with tenants.',
  admin: 'Set up properties and units, then share join links with tenants.',
  tenant: 'Use the invite code from your landlord to access your unit.',
  housekeeper: 'View units and maintenance for properties you care for.',
  caretaker: 'View units and maintenance for properties you care for.',
  accountant: 'Track payments, balances, and reports for the owner.',
}

export const ROLE_LABELS: Record<string, string> = {
  property_owner: 'Property Owner',
  admin: 'Property Owner',
  tenant: 'Tenant',
  housekeeper: 'Housekeeper',
  caretaker: 'Housekeeper',
  accountant: 'Accountant',
}

export const ROLE_BADGE_CLASS: Record<string, string> = {
  property_owner: 'bg-[#2d6a4f] text-white',
  admin: 'bg-[#2d6a4f] text-white',
  tenant: 'bg-blue-600 text-white',
  housekeeper: 'bg-orange-600 text-white',
  caretaker: 'bg-orange-600 text-white',
  accountant: 'bg-purple-600 text-white',
}
