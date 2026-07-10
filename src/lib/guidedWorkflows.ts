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
    roles: ['property_owner'],
    steps: [
      { title: 'Open Properties', instructions: 'Go to the Properties page from the sidebar.', targetPage: 'buildings' },
      { title: 'Add building', instructions: 'Click Add Building. Enter name, address, and caretaker contact.', targetPage: 'buildings' },
      { title: 'Add units', instructions: 'Open Units. Click Add Unit for each rentable space. Set rent and due day.', targetPage: 'units' },
      { title: 'Review dashboard', instructions: 'Check the dashboard to see occupancy and expected rent.', targetPage: 'dashboard' },
    ],
  },
  {
    id: 'owner_invite_tenant',
    title: 'Invite a tenant with join link',
    description: 'Generate a link and code for your tenant to register free.',
    roles: ['property_owner'],
    steps: [
      { title: 'Open Units', instructions: 'Go to Units and pick a vacant unit.', targetPage: 'units' },
      { title: 'Copy tenant link', instructions: 'Use Copy tenant link or Copy code only on the unit card.', targetPage: 'units' },
      { title: 'Send to tenant', instructions: 'Paste the WhatsApp template text or share the link by SMS.', targetPage: 'units' },
      { title: 'They join at /join/tenant', instructions: 'Tenant opens the link, creates a free account, and sees their unit.', targetPage: 'tenants' },
    ],
  },
  {
    id: 'tenant_join_with_code',
    title: 'Join with your invite code',
    description: 'Register free using the link from your landlord.',
    roles: ['tenant'],
    steps: [
      { title: 'Open join link', instructions: 'Go to /join/tenant or use the link your landlord sent.', targetPage: 'my-balance' },
      { title: 'Enter code', instructions: 'Type the code if it is not already in the URL.', targetPage: 'my-balance' },
      { title: 'Create account', instructions: 'Register with email and password — no payment needed.', targetPage: 'my-balance' },
      { title: 'See your unit', instructions: 'Home shows what you owe for your unit only.', targetPage: 'my-balance' },
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
    roles: ['property_owner'],
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
    roles: ['property_owner'],
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
  {
    id: 'owner_quick_tenant',
    title: 'Quick add a tenant',
    description: 'Add a tenant in under a minute — no spreadsheet or PDF needed.',
    roles: ['property_owner'],
    steps: [
      { title: 'Pick a unit', instructions: 'Go to Units and find a vacant unit.', targetPage: 'units' },
      { title: 'Quick add', instructions: 'Tap Quick add tenant. Enter name, phone (optional), and rent.', targetPage: 'units' },
      { title: 'Share invite code', instructions: 'Copy the 6-character code and send it to your tenant.', targetPage: 'units' },
    ],
  },
  {
    id: 'owner_import_sheet',
    title: 'Import from spreadsheet',
    description: 'Upload a CSV from Excel or Google Sheets.',
    roles: ['property_owner'],
    steps: [
      { title: 'Download template', instructions: 'Open Data Import and download the sample CSV.', targetPage: 'data-import' },
      { title: 'Upload file', instructions: 'Save your sheet as CSV and upload it.', targetPage: 'data-import' },
      { title: 'Preview & confirm', instructions: 'Check the preview table, then confirm import.', targetPage: 'data-import' },
      { title: 'Review flagged rows', instructions: 'Fix any rows marked for review on the Tenants page.', targetPage: 'tenants' },
    ],
  },
  {
    id: 'owner_attach_agreement',
    title: 'Attach a PDF agreement',
    description: 'Store tenancy agreements and share when ready.',
    roles: ['property_owner'],
    steps: [
      { title: 'Open tenant', instructions: 'Go to Tenants and click the tenant row.', targetPage: 'tenants' },
      { title: 'Upload PDF', instructions: 'Documents tab → Attach agreement. Upload your PDF.', targetPage: 'tenants' },
      { title: 'Confirm fields', instructions: 'Check rent and lease dates — edit if needed.', targetPage: 'tenants' },
      { title: 'Share toggle', instructions: 'Turn on "Share with tenant" only when you want them to see the PDF.', targetPage: 'tenants' },
    ],
  },
  {
    id: 'tenant_first_look',
    title: 'Your first look',
    description: 'What you can see as a tenant.',
    roles: ['tenant'],
    steps: [
      { title: 'What you owe', instructions: 'Home shows your rent balance and due date.', targetPage: 'my-balance' },
      { title: 'Where to pay', instructions: 'Use the MoMo numbers on Home. Then notify your landlord.', targetPage: 'my-payments' },
      { title: 'Lease summary', instructions: 'Lease tab shows your unit, rent, and contact info.', targetPage: 'my-lease' },
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
