export type FaqEntry = {
  keywords: string[]
  roles: string[]
  answer: string
  offerPage?: string
  offerPageId?: string
  offerWorkflowId?: string
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    keywords: ['add unit', 'create unit', 'new unit'],
    roles: ['property_owner'],
    answer: 'Go to Units → Add Unit. Enter the unit label (e.g. Flat 2B), monthly rent, and due day. Each unit can have a different rent amount.',
    offerPage: 'Units',
    offerPageId: 'units',
    offerWorkflowId: 'add_property',
  },
  {
    keywords: ['add property', 'building', 'new property'],
    roles: ['property_owner'],
    answer: 'Open Properties → Add Building. Enter the name and address. Then add units inside that property.',
    offerPage: 'Properties',
    offerPageId: 'buildings',
    offerWorkflowId: 'add_property',
  },
  {
    keywords: ['invite', 'invite code', 'tenant register'],
    roles: ['property_owner'],
    answer: 'Settings → Invite tenants lists every vacant unit with copy-link buttons. You can also invite from the Units page.',
    offerPage: 'Settings',
    offerPageId: 'settings',
    offerWorkflowId: 'owner_invite_tenant',
  },
  {
    keywords: ['inbox', 'messages', 'tenant message'],
    roles: ['property_owner'],
    answer: 'Open Tenant Messages from Settings → More tools (or search Inbox). Reply to tenants by unit thread. New messages also appear in the bell.',
    offerPage: 'Tenant Messages',
    offerPageId: 'messages',
  },
  {
    keywords: ['record payment', 'log payment', 'enter payment'],
    roles: ['property_owner'],
    answer: 'Go to Payments → fill in tenant, amount, date, and MoMo reference → Save. A receipt is created automatically.',
    offerPage: 'Payments',
    offerPageId: 'payments',
    offerWorkflowId: 'record_payment',
  },
  {
    keywords: ['arrears', 'owe', 'defaulter', 'balance'],
    roles: ['property_owner'],
    answer: 'Open Balance Tracker to see who owes rent. Use Reminders to send follow-up messages. Tenants and caretakers cannot see this page.',
    offerPage: 'Rent Ledger',
    offerPageId: 'balance-tracker',
  },
  {
    keywords: ['tenant see', 'what can tenant', 'tenant view'],
    roles: ['property_owner'],
    answer: 'Tenants only see their own unit: what they owe, their payments, lease, and help. They never see your notes, other tenants, or portfolio stats.',
  },
  {
    keywords: ['subscribe', 'subscription', 'trial', 'pay'],
    roles: ['property_owner'],
    answer: 'After your 14-day trial, go to Plans & Billing. Pay via MTN MoMo to 0793068911 and enter your transaction reference.',
    offerPage: 'Plans & Billing',
    offerPageId: 'subscription',
  },
  {
    keywords: ['demo', 'training', 'sample', 'practice'],
    roles: ['property_owner'],
    answer: 'Turn on Demo Mode in the header to practice with Nakawa Heights sample data. Sample messages and bell alerts load automatically.',
    offerPage: 'Dashboard',
    offerPageId: 'dashboard',
  },
  {
    keywords: ['pay rent', 'how to pay', 'momo', 'payment number'],
    roles: ['tenant'],
    answer: 'On Home you will see your landlord MTN MoMo and Airtel numbers. Pay the amount shown and use the reference on screen. Then go to Payments → I paid.',
    offerPage: 'Pay',
    offerPageId: 'my-payments',
  },
  {
    keywords: ['what i owe', 'balance', 'amount due'],
    roles: ['tenant'],
    answer: 'Open Home to see what you owe for your unit. This is only your rent — not other tenants.',
    offerPage: 'Home',
    offerPageId: 'my-balance',
  },
  {
    keywords: ['invite code', 'register', 'sign up'],
    roles: ['tenant'],
    answer: 'Your landlord gives you an invite code and link. Open the link, enter the code, and create a free password. No subscription needed.',
  },
  {
    keywords: ['lease', 'contract', 'move out'],
    roles: ['tenant'],
    answer: 'Your lease dates are on the Lease tab. To change rent or move-out, contact your landlord directly — they update the system.',
    offerPage: 'Lease',
    offerPageId: 'my-lease',
  },
  {
    keywords: ['wrong', 'incorrect', 'balance wrong', 'payment issue'],
    roles: ['tenant'],
    answer: 'Check Payments for your history. If something is wrong, call the number on your Lease tab.',
    offerPage: 'Pay',
    offerPageId: 'my-payments',
  },
  {
    keywords: ['help', 'support', 'contact'],
    roles: ['tenant', 'property_owner', 'caretaker'],
    answer: 'Open Help for FAQs and manuals, or use Ask Assistant. For rent disputes, tenants should contact their landlord — not the app developer.',
    offerPage: 'Help',
    offerPageId: 'help',
  },
  {
    keywords: ['maintenance', 'repair', 'broken'],
    roles: ['caretaker', 'tenant', 'property_owner'],
    answer: 'Caretakers: log issues under Repairs. Tenants: message your landlord on the Messages tab.',
    offerPage: 'Repairs',
    offerPageId: 'maintenance',
  },
  {
    keywords: ['import', 'spreadsheet', 'excel', 'csv', 'upload tenants'],
    roles: ['property_owner'],
    answer: 'Open Data Import from Settings → More tools. Download the template, fill your tenant list, save as CSV, and upload.',
    offerPage: 'Data Import',
    offerPageId: 'data-import',
  },
  {
    keywords: ['quick add', 'add tenant', 'no agreement'],
    roles: ['property_owner'],
    answer: 'On Units, tap Quick add tenant on any vacant unit. Enter name and phone if you have them. You get an invite code to share.',
    offerPage: 'Units',
    offerPageId: 'units',
  },
  {
    keywords: ['pdf', 'agreement', 'attach', 'tenancy'],
    roles: ['property_owner'],
    answer: 'Open a tenant → Documents → Attach agreement. Upload a PDF under 800KB. Toggle "Share with tenant" when you want them to see it.',
    offerPage: 'Tenants',
    offerPageId: 'tenants',
  },
  {
    keywords: ['agreement', 'lease document', 'pdf'],
    roles: ['tenant'],
    answer: 'Your landlord may share your agreement on the Lease tab. Contact your landlord if something looks wrong.',
    offerPage: 'Lease',
    offerPageId: 'my-lease',
  },
  {
    keywords: ['caretaker', 'invite caretaker', 'keeper'],
    roles: ['property_owner'],
    answer: 'Settings → Invite caretaker. Pick the property first so the join page shows the correct name and address.',
    offerPage: 'Settings',
    offerPageId: 'settings',
  },
  {
    keywords: ['about', 'what is nyumbatrack', 'who made'],
    roles: ['property_owner', 'tenant', 'caretaker'],
    answer: 'NyumbaTrack is rent management software built for Uganda. Owners manage properties; tenants and caretakers get simple portals. Open About for your role-specific overview.',
    offerPage: 'About',
    offerPageId: 'about',
  },
  {
    keywords: ['partner rewards', 'referral', 'refer', 'invite landlord', 'free month'],
    roles: ['property_owner'],
    answer: 'Partner Rewards lets you refer another landlord. When they subscribe, you bank free months toward your renewal. Copy your personal link from Partner Rewards or Plans & Billing.',
    offerPage: 'Partner Rewards',
    offerPageId: 'referrals',
  },
]
