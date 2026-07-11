#!/usr/bin/env node
/**
 * CI / zero-touch VAPID configure — uses GitHub Actions VERCEL_* secrets.
 * Skips if production already has vapid: true.
 * Generates keys if VAPID_* env not provided.
 */
import webpush from 'web-push'
import {
  createVercelClient,
  fetchProductionHealth,
  formatMissingVapidEnv,
  PROD_URL,
} from './lib/vercelVapid.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@nyumbatracker.app'

const health = await fetchProductionHealth().catch(() => ({}))
if (health.vapid) {
  console.log(`✓ Production already has vapid: true (${PROD_URL})`)
  process.exit(0)
}

const missing = formatMissingVapidEnv(health.vapidEnv)
if (missing.length) {
  console.log(`Production missing: ${missing.join(', ')}`)
}

let publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
let privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
let vapidSubject = process.env.VAPID_SUBJECT?.trim() || subject

if (publicKey && privateKey && vapidSubject) {
  console.log('Using VAPID_* from environment (GitHub secrets)')
} else {
  const generated = webpush.generateVAPIDKeys()
  publicKey = generated.publicKey
  privateKey = generated.privateKey
  console.log('Generated new VAPID keys for Vercel Production')
  console.log('(Store as GitHub secrets VAPID_* to reuse same keys across runs)')
}

const { findProject, upsertEnv, verifyProductionKeys, triggerDeploy } = createVercelClient()
const project = await findProject()
console.log(`Project: ${project.name} (${project.id})`)

console.log('\nUploading VAPID env to Production...')
await upsertEnv(project.id, 'VAPID_PUBLIC_KEY', publicKey)
await upsertEnv(project.id, 'VAPID_PRIVATE_KEY', privateKey)
await upsertEnv(project.id, 'VAPID_SUBJECT', vapidSubject)

const verified = await verifyProductionKeys(project.id)
if (!verified.ok) {
  console.error(`FAIL — Vercel Production still missing: ${verified.missing.join(', ')}`)
  process.exit(1)
}
console.log(`Verified on Vercel Production: ${verified.present.join(', ')}`)

if (process.env.SKIP_DEPLOY === '1') {
  console.log('\nSKIP_DEPLOY=1 — keys on Vercel; redeploy via workflow vercel CLI step')
  process.exit(0)
}

const deployed = await triggerDeploy(project)
if (!deployed) {
  console.log('Note: API redeploy skipped (no git link). Workflow will run vercel deploy next.')
  process.exit(0)
}

const waitSec = Math.max(60, Number(process.env.WAIT_SECS || 120))
console.log(`\nWaiting for production vapid:true (up to ${waitSec}s)...`)
const deadline = Date.now() + waitSec * 1000
while (Date.now() < deadline) {
  await sleep(15_000)
  const h = await fetchProductionHealth().catch(() => ({}))
  console.log(`  health: vapid=${h.vapid} push=${h.push}`)
  if (h.vapid) {
    const vapidRes = await fetch(`${PROD_URL}/api/push-vapid`).then((r) => r.json()).catch(() => ({}))
    if (vapidRes.publicKey) {
      console.log('\n✓ VAPID live on production')
      process.exit(0)
    }
  }
}

console.error('\nTimed out — env may be set; redeploy still propagating. Re-run workflow or check:vapid.')
process.exit(1)
