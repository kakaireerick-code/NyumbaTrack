import { normalizeRole } from './permissions'

export type WorkflowStep = {
  title: string
  instructions: string
  targetPage: string
}

export type Workflow = {
  id: string
  title: string
  description: string
  roles: string[]
  steps: WorkflowStep[]
}

export const WORKFLOWS: Workflow[] = [
  {
    id: 'add_property',
    title: 'Add a property',
    description: 'Create your first building and units with rent.',
    roles: ['property_owner', 'accountant'],
    steps: [
      { title: 'Open Properties', instructions: 'Go to the Properties page from the sidebar.', targetPage: 'buildings' },
      { title: 'Add building', instructions: 'Click Add Building. Enter name, address, and caretaker contact.', targetPage: 'buildings' },
      { title: 'Add units', instructions: 'Open Units. Click Add Unit for each rentable space. Set rent and due day.', targetPage: 'units' },
      { title: 'Review dashboard', instructions: 'Check the dashboard to see occupancy and expected rent.', targetPage: 'dashboard' },
    ],
  },
  {
    id: 'invite_tenant',
    title: 'Invite a tenant',
    description: 'Give your tenant a code so they can register for free.',
    roles: ['property_owner'],
    steps: [
      { title: 'Pick a vacant unit', instructions: 'Go to Units and find a vacant unit.', targetPage: 'units' },
      { title: 'Copy invite code', instructions: 'Each vacant unit has a 6-character code. Share it by SMS or WhatsApp.', targetPage: 'units' },
      { title: 'Tenant registers', instructions: 'They choose Tenant → Register and enter the code. No payment needed.', targetPage: 'tenants' },
      { title: 'Confirm assignment', instructions: 'The unit shows as occupied once they register.', targetPage: 'tenants' },
    ],
  },
  {
    id: 'record_payment',
    title: 'Record a rent payment',
    description: 'Log money received from a tenant.',
    roles: ['property_owner', 'accountant'],
    steps: [
      { title: 'Open Payments', instructions: 'Go to Payments from the sidebar.', targetPage: 'payments' },
      { title: 'Select tenant', instructions: 'Choose the tenant and enter amount, date, and MoMo reference.', targetPage: 'payments' },
      { title: 'Save & receipt', instructions: 'A receipt is generated automatically. You can send it via WhatsApp.', targetPage: 'payments' },
    ],
  },
  {
    id: 'view_arrears',
    title: 'See who owes rent',
    description: 'Find tenants with outstanding balances.',
    roles: ['property_owner', 'accountant'],
    steps: [
      { title: 'Rent ledger', instructions: 'Open Balance Tracker to sort by most in arrears.', targetPage: 'balance-tracker' },
      { title: 'Send reminders', instructions: 'Use Reminders to message tenants in English or Luganda.', targetPage: 'reminders' },
    ],
  },
  {
    id: 'first_login',
    title: 'Your first visit',
    description: 'Learn what you can see as a tenant.',
    roles: ['tenant'],
    steps: [
      { title: 'Your home', instructions: 'Home shows what you owe and when rent is due.', targetPage: 'my-balance' },
      { title: 'Payments tab', instructions: 'See history and notify your landlord after you pay.', targetPage: 'my-payments' },
      { title: 'Lease tab', instructions: 'View your lease dates and landlord contact.', targetPage: 'my-lease' },
      { title: 'Help', instructions: 'Open Help anytime — no need to call anyone.', targetPage: 'help' },
    ],
  },
  {
    id: 'how_to_pay',
    title: 'How to pay rent',
    description: 'Pay using your landlord MoMo numbers.',
    roles: ['tenant'],
    steps: [
      { title: 'Open Home', instructions: 'See the amount due and payment numbers.', targetPage: 'my-balance' },
      { title: 'Send MoMo', instructions: 'Pay via MTN MoMo or Airtel Money using the reference shown.', targetPage: 'my-balance' },
      { title: 'Notify landlord', instructions: 'Go to Payments → I paid → enter your transaction reference.', targetPage: 'my-payments' },
    ],
  },
  {
    id: 'report_payment_issue',
    title: 'Payment looks wrong?',
    description: 'Steps if your balance seems incorrect.',
    roles: ['tenant'],
    steps: [
      { title: 'Check Payments tab', instructions: 'Confirm your payment was recorded.', targetPage: 'my-payments' },
      { title: 'Contact landlord', instructions: 'Use the phone number on your Lease tab.', targetPage: 'my-lease' },
      { title: 'Ask assistant', instructions: 'Open Ask Assistant and type "balance wrong".', targetPage: 'assistant' },
    ],
  },
]

export const workflowsForRole = (role: string): Workflow[] => {
  const r = normalizeRole(role)
  return WORKFLOWS.filter((w) => w.roles.includes(r) || (r === 'property_owner' && w.roles.includes('property_owner')))
}

export const canStartWorkflow = (role: string, workflowId: string): boolean =>
  workflowsForRole(role).some((w) => w.id === workflowId)

export const getWorkflow = (workflowId: string): Workflow | undefined =>
  WORKFLOWS.find((w) => w.id === workflowId)
