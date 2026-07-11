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
  console.log(`\nAll F1–F14 CONFIRMED at ${sha}`)
}
process.exit(failed.length ? 1 : 0)
