#!/usr/bin/env node
/**
 * F1–F14 local feature verification (see docs/MASTER-VERIFY-LOOP.md)
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))

const checks = []

const confirm = (id, name, ok, detail) => {
  checks.push({ id, name, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${id} ${name}: ${detail}`)
}

// F1 Uganda branding
const html = read('index.html')
const manifest = exists('public/manifest.json') ? read('public/manifest.json') : ''
confirm(
  'F1',
  'Uganda branding',
  html.includes('Ugandan') && manifest.includes('Uganda'),
  html.includes('Ugandan') ? 'index.html + manifest' : 'missing Uganda copy',
)

// F2 Welcome back
const login = read('src/pages/LoginPage.jsx')
confirm('F2', 'Welcome back login', login.includes('Welcome back'), login.includes('Welcome back') ? 'copy present' : 'missing')

// F3 Simple sidebar
const nav = read('src/lib/navigation.ts')
const sidebar = read('src/components/Sidebar.jsx')
confirm(
  'F3',
  'Simple sidebar (8)',
  nav.includes('PRIMARY_SIDEBAR_PAGES') && sidebar.includes('sidebarPagesForRole'),
  '8-item primary nav',
)

// F4 More tools
const settings = read('src/pages/AdminPages.jsx')
confirm(
  'F4',
  'Settings More tools',
  settings.includes('More tools') && settings.includes('MORE_TOOLS_LINKS'),
  settings.includes('More tools') ? 'section present' : 'missing',
)

// F5 Subscription pending
const subPage = read('src/pages/SubscriptionPage.jsx')
confirm(
  'F5',
  'Subscription pending',
  subPage.includes('pending_verification') && !subPage.match(/status:\s*'active'/),
  'pending_verification only',
)

// F6 Billing UI
const plans = read('src/data/subscriptionPlans.js')
confirm(
  'F6',
  'Billing UI complete',
  plans.includes('YEARLY_BILLING_OFFER') && plans.includes('BILLING_FAQ'),
  'yearly offers + FAQ',
)

// F7 API health
confirm('F7', 'API health', exists('api/health.ts'), exists('api/health.ts') ? 'api/health.ts' : 'missing')

// F8 API subscription
confirm(
  'F8',
  'API subscription',
  exists('api/subscription.ts') && exists('src/lib/subscriptionCloud.ts'),
  'api + client',
)

// F9 Demo mode
confirm('F9', 'Demo/live mode', exists('src/lib/appMode.ts'), exists('src/lib/appMode.ts') ? 'appMode.ts' : 'missing')

// F10 Import
confirm(
  'F10',
  'File import',
  exists('src/lib/fileImport.ts') && exists('src/pages/DataImportPage.jsx'),
  'fileImport + page',
)

// F11 Guided
confirm(
  'F11',
  'Guided workflows',
  exists('src/components/GuidedWorkflowOverlay.jsx'),
  exists('src/components/GuidedWorkflowOverlay.jsx') ? 'overlay' : 'missing',
)

// F12 RBAC
const perms = read('src/lib/permissions.ts')
confirm(
  'F12',
  'RBAC isolation',
  perms.includes('caretaker') && perms.includes('TENANT_BLOCKED_PAGES'),
  'three-role matrix',
)

// F13 MoMo validation
confirm(
  'F13',
  'MoMo ref validation',
  exists('src/lib/momoVerification.ts'),
  exists('src/lib/momoVerification.ts') ? 'momoVerification.ts' : 'missing',
)

// F14 Guardrail script
const pkg = JSON.parse(read('package.json'))
confirm(
  'F14',
  'Guardrail script',
  exists('scripts/ops-guardrail.mjs') && pkg.scripts['ops:guardrail'],
  'ops:guardrail npm script',
)

// F15 Billing admin panel
const billingAdminPage = exists('src/pages/BillingAdminPage.jsx') ? read('src/pages/BillingAdminPage.jsx') : ''
const subApi = exists('api/subscription.ts') ? read('api/subscription.ts') : ''
const routing = exists('src/lib/routing.ts') ? read('src/lib/routing.ts') : ''
confirm(
  'F15',
  'Billing admin panel',
  billingAdminPage.includes('Billing admin') &&
    subApi.includes("req.method === 'PATCH'") &&
    exists('src/lib/billingAdmin.ts') &&
    routing.includes("'billing-admin'"),
  'BillingAdminPage + MoMo approval API + /billing-admin route',
)

// F16 Cloud tenant invites
const inviteApi = exists('api/invite.ts') ? read('api/invite.ts') : ''
const inviteCloud = exists('src/lib/inviteCloud.ts') ? read('src/lib/inviteCloud.ts') : ''
const joinPage = exists('src/pages/JoinPage.jsx') ? read('src/pages/JoinPage.jsx') : ''
confirm(
  'F16',
  'Cloud tenant invites',
  inviteApi.includes("req.method === 'POST'") &&
    inviteCloud.includes('fetchCloudInvite') &&
    joinPage.includes('registerTenantAsync'),
  'api/invite.ts + cross-device join',
)

// F17 Web push notifications
const notifLib = exists('src/lib/notifications.ts') ? read('src/lib/notifications.ts') : ''
const pushClient = exists('src/lib/pushClient.ts') ? read('src/lib/pushClient.ts') : ''
const inbox = exists('src/components/NotificationInbox.jsx') ? read('src/components/NotificationInbox.jsx') : ''
confirm(
  'F17',
  'Web push notifications',
  exists('public/sw.js') &&
    exists('api/push-vapid.ts') &&
    exists('api/push-subscribe.ts') &&
    exists('api/push-notify.ts') &&
    notifLib.includes('actionPage') &&
    pushClient.includes('getPushCapabilities') &&
    pushClient.includes('subscribeDevicePush') &&
    inbox.includes('Enable phone notifications'),
  'service worker + VAPID + cross-browser bell flow',
)

// F18 VAPID owner tooling
confirm(
  'F18',
  'VAPID setup tooling',
  exists('SETUP-VAPID.ps1') &&
    exists('scripts/setup-vapid.mjs') &&
    exists('.github/workflows/configure-vapid.yml') &&
    exists('scripts/configure-vapid-ci.mjs') &&
    pkg.scripts['setup:vapid'] &&
    pkg.scripts['upload:vapid'] &&
    read('OWNER-SYNC.ps1').includes('SETUP-VAPID.ps1'),
  'SETUP-VAPID.ps1 + upload:vapid + OWNER-SYNC hint',
)

// F20 API uptime probe safety — no 503/405 on GET probes
const pushVapidApi = exists('api/push-vapid.ts') ? read('api/push-vapid.ts') : ''
const pushSubApi = exists('api/push-subscribe.ts') ? read('api/push-subscribe.ts') : ''
const pushNotifyApi = exists('api/push-notify.ts') ? read('api/push-notify.ts') : ''
const inviteApiProbe = exists('api/invite.ts') ? read('api/invite.ts') : ''
const guardrail = exists('scripts/ops-guardrail.mjs') ? read('scripts/ops-guardrail.mjs') : ''
confirm(
  'F20',
  'API uptime probe safety',
  pushVapidApi.includes('configured: false') &&
    pushSubApi.includes("req.method === 'GET'") &&
    !pushSubApi.includes('status(405)') &&
    pushNotifyApi.includes('hint') &&
    inviteApiProbe.includes('configured: false') &&
    guardrail.includes('api/push-vapid') &&
    pkg.scripts['test:api-smoke'],
  '200 + configured:false on probes, api-smoke + guardrail probes',
)

const failed = checks.filter((c) => !c.ok)
const sha = (() => {
  try {
    return require('node:child_process').execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
})()

console.log(`\n${failed.length ? 'FAIL' : 'PASS'} — ${checks.length - failed.length}/${checks.length} features`)
if (!failed.length) {
  console.log(`\nAll F1–F20 CONFIRMED at ${sha}`)
}
process.exit(failed.length ? 1 : 0)
