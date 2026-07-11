#!/usr/bin/env node
/**
 * Generate VAPID keys and optionally upload to Vercel Production.
 * Use upload:vapid instead to upload existing vapid-keys.local without regenerating.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import webpush from 'web-push'
import {
  createVercelClient,
  KEYS_FILE,
  fetchProductionHealth,
} from './lib/vercelVapid.mjs'

const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@nyumbatracker.app'
const token = process.env.VERCEL_TOKEN?.trim()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const runCheck = () =>
  new Promise((resolve) => {
    const child = spawn('npm', ['run', 'check:vapid'], {
      stdio: 'inherit',
      env: { ...process.env },
      shell: true,
    })
    child.on('close', (code) => resolve(code === 0))
  })

const health = await fetchProductionHealth().catch(() => ({}))
if (health.vapid) {
  console.log('Production already has vapid: true.')
  process.exit(0)
}

const keys = webpush.generateVAPIDKeys()
const lines = [
  `VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  `VAPID_SUBJECT=${subject}`,
]
writeFileSync(join(process.cwd(), KEYS_FILE), `${lines.join('\n')}\n`, 'utf8')

console.log('NyumbaTrack VAPID setup (generated new keys)\n')
for (const line of lines) console.log(line)
console.log(`\nSaved to ${KEYS_FILE}\n`)

if (!token) {
  console.log('No VERCEL_TOKEN — paste into Vercel Production, redeploy, then:')
  console.log('  npm run check:vapid')
  console.log('Or upload existing file later: npm run upload:vapid')
  process.exit(0)
}

const { findProject, upsertEnv, verifyProductionKeys, triggerDeploy } = createVercelClient()
const project = await findProject()
console.log(`Uploading to ${project.name}...`)

await upsertEnv(project.id, 'VAPID_PUBLIC_KEY', keys.publicKey)
await upsertEnv(project.id, 'VAPID_PRIVATE_KEY', keys.privateKey)
await upsertEnv(project.id, 'VAPID_SUBJECT', subject)

const verified = await verifyProductionKeys(project.id)
if (!verified.ok) {
  console.error(`FAIL — missing on Vercel: ${verified.missing.join(', ')}`)
  process.exit(1)
}
console.log(`Verified on Production: ${verified.present.join(', ')}`)

if (!process.env.SKIP_DEPLOY) {
  const deployed = await triggerDeploy(project)
  if (deployed && !process.env.SKIP_VERIFY) {
    console.log('\nWaiting 90s for deploy...')
    await sleep(90_000)
    const ok = await runCheck()
    process.exit(ok ? 0 : 1)
  }
}

console.log('\nDone. Run: npm run check:vapid')
