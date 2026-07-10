export type FaqEntry = {
  keywords: string[]
  roles: string[]
  answer: string
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    keywords: ['add unit', 'create unit', 'new unit'],
    roles: ['property_owner', 'accountant'],
    answer: 'Go to Units → Add Unit. Enter the unit label (e.g. Flat 2B), monthly rent, and due day. Each unit can have a different rent amount.',
  },
  {
    keywords: ['add property', 'building', 'new property'],
    roles: ['property_owner'],
    answer: 'Open Properties → Add Building. Enter the name and address. Then add units inside that property.',
  },
  {
    keywords: ['invite', 'invite code', 'tenant register'],
    roles: ['property_owner'],
    answer: 'Each vacant unit has a 6-character invite code on the Units page. Share it with your tenant. They register free under Tenant → Register.',
  },
  {
    keywords: ['record payment', 'log payment', 'enter payment'],
    roles: ['property_owner', 'accountant'],
    answer: 'Go to Payments → fill in tenant, amount, date, and MoMo reference → Save. A receipt is created automatically.',
  },
  {
    keywords: ['arrears', 'owe', 'defaulter', 'balance'],
    roles: ['property_owner', 'accountant'],
    answer: 'Open Balance Tracker to see who owes rent. Use Reminders to send follow-up messages. Tenants cannot see this page.',
  },
  {
    keywords: ['tenant see', 'what can tenant', 'tenant view'],
    roles: ['property_owner'],
    answer: 'Tenants only see their own unit: what they owe, their payments, lease, and help. They never see your notes, other tenants, or portfolio stats. Use Tenant Preview to check.',
  },
  {
    keywords: ['subscribe', 'subscription', 'trial', 'pay'],
    roles: ['property_owner'],
    answer: 'After your 14-day trial, go to Plans & Billing. Pay via MTN MoMo to 0793068911 and enter your transaction reference. An invoice is sent to your Google email.',
  },
  {
    keywords: ['demo', 'training', 'sample'],
    roles: ['property_owner'],
    answer: 'Turn on Demo Mode in the header to practice with sample apartments. Your real data is hidden until you turn demo off.',
  },
  {
    keywords: ['pay rent', 'how to pay', 'momo', 'payment number'],
    roles: ['tenant'],
    answer: 'On Home you will see your landlord MTN MoMo and Airtel numbers. Pay the amount shown and use the reference on screen. Then go to Payments → I paid.',
  },
  {
    keywords: ['what i owe', 'balance', 'amount due'],
    roles: ['tenant'],
    answer: 'Open Home to see what you owe for your unit. This is only your rent — not other tenants.',
  },
  {
    keywords: ['invite code', 'register', 'sign up'],
    roles: ['tenant'],
    answer: 'Your landlord gives you a 6-character code. Choose Tenant → Register, enter the code, and create a free password. No subscription needed.',
  },
  {
    keywords: ['lease', 'contract', 'move out'],
    roles: ['tenant'],
    answer: 'Your lease dates are on the Lease tab. To change rent or move-out, contact your landlord directly — they update the system.',
  },
  {
    keywords: ['wrong', 'incorrect', 'balance wrong', 'payment issue'],
    roles: ['tenant'],
    answer: 'Check Payments for your history. If something is wrong, call the number on your Lease tab. You can also use the "report payment issue" guided workflow.',
  },
  {
    keywords: ['help', 'support', 'contact'],
    roles: ['tenant', 'property_owner', 'housekeeper'],
    answer: 'Open Help for FAQs and manuals, or use Ask Assistant. For rent disputes, tenants should contact their landlord — not the app developer.',
  },
  {
    keywords: ['maintenance', 'repair', 'broken'],
    roles: ['housekeeper', 'tenant', 'property_owner'],
    answer: 'Housekeepers: log issues under Maintenance. Tenants: call the caretaker number on your Lease tab.',
  },
]
