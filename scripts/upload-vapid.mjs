#!/usr/bin/env node
/**
 * Upload existing vapid-keys.local to Vercel Production (no regeneration).
 *
 * Env: VERCEL_TOKEN (required), VERCEL_ORG_ID, VERCEL_PROJECT_ID
 *      SKIP_DEPLOY=1, SKIP_VERIFY=1, WAIT_SECS=120
 */
import { spawn } from 'node:child_process'
import {
  parseVapidKeysFile,
  createVercelClient,
  fetchProductionHealth,
  formatMissingVapidEnv,
  KEYS_FILE,
} from './lib/vercelVapid.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const runCheck = (waitSec = 0) =>
  new Promise((resolve) => {
    const env = { ...process.env }
    if (waitSec > 0) env.WAIT_SECS = String(waitSec)
    const child = spawn('npm', ['run', 'check:vapid'], { stdio: 'inherit', env, shell: true })
    child.on('close', (code) => resolve(code === 0))
  })

console.log('NyumbaTrack upload:vapid\n')

const health = await fetchProductionHealth().catch(() => ({}))
if (health.vapid) {
  console.log('Production already has vapid: true — nothing to upload.')
  process.exit(0)
}

const missing = formatMissingVapidEnv(health.vapidEnv)
if (missing.length) {
  console.log(`Production missing: ${missing.join(', ')}`)
}

const keys = parseVapidKeysFile()
console.log(`Using ${KEYS_FILE} (existing keys — not regenerating)\n`)

const { findProject, upsertEnv, verifyProductionKeys, triggerDeploy } = createVercelClient()
const project = await findProject()
console.log(`Project: ${project.name} (${project.id})\n`)

console.log('Uploading to Vercel Production...')
await upsertEnv(project.id, 'VAPID_PUBLIC_KEY', keys.publicKey)
await upsertEnv(project.id, 'VAPID_PRIVATE_KEY', keys.privateKey)
await upsertEnv(project.id, 'VAPID_SUBJECT', keys.subject)

const verified = await verifyProductionKeys(project.id)
if (!verified.ok) {
  console.error(`\nFAIL — Vercel Production still missing: ${verified.missing.join(', ')}`)
  process.exit(1)
}
console.log(`\nVerified on Vercel Production: ${verified.present.join(', ')}`)

if (process.env.SKIP_DEPLOY) {
  console.log('\nSKIP_DEPLOY=1 — redeploy manually, then: npm run check:vapid')
  process.exit(0)
}

const deployed = await triggerDeploy(project)
if (!deployed) {
  console.log('\nRedeploy manually, then: .\\CHECK-VAPID.ps1 -Wait')
  process.exit(0)
}

if (process.env.SKIP_VERIFY) {
  console.log('\nDone. Run: npm run check:vapid')
  process.exit(0)
}

const waitSec = Number(process.env.WAIT_SECS || 120)
console.log(`\nWaiting ${waitSec}s for deploy, then checking production...`)
await sleep(Math.min(waitSec, 90_000))

const ok = await runCheck(waitSec > 90 ? waitSec - 90 : 30)
process.exit(ok ? 0 : 1)
