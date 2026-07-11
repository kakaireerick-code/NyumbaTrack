#!/usr/bin/env node
/**
 * Ship agent work to production: merge PR → wait for Vercel deploy → guardrail.
 * Usage:
 *   node scripts/ship-to-production.mjs --branch cursor/foo-ae35
 *   node scripts/ship-to-production.mjs --pr 48
 * Cloud agents: run at end of a turn after push, or trigger GitHub workflow auto-ship.
 */
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const branchIdx = args.indexOf('--branch')
const prIdx = args.indexOf('--pr')
const branch = branchIdx >= 0 ? args[branchIdx + 1] : ''
const pr = prIdx >= 0 ? args[prIdx + 1] : ''

const run = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim()

const gh = (cmd) => run(`gh ${cmd}`)

try {
  gh('auth status')
} catch {
  console.error('gh CLI not authenticated — merge manually on GitHub.')
  process.exit(1)
}

let prNumber = pr
if (!prNumber && branch) {
  try {
    prNumber = gh(`pr list --head "${branch}" --base main --state open --json number -q '.[0].number'`)
  } catch {
    prNumber = ''
  }
}

if (!prNumber) {
  console.log('No open PR to merge. If already on main, checking deploy only...')
} else {
  console.log(`Merging PR #${prNumber}...`)
  gh(`pr merge ${prNumber} --merge --delete-branch=false`)
  console.log('Merged.')
}

console.log('Waiting for Deploy to Vercel workflow on main...')
for (let i = 0; i < 40; i++) {
  const json = gh('run list --workflow=deploy.yml --branch=main --limit=1 --json status,conclusion')
  const row = JSON.parse(json)[0]
  if (row?.status === 'completed') {
    if (row.conclusion !== 'success') {
      console.error(`Deploy workflow failed: ${row.conclusion}`)
      process.exit(1)
    }
    console.log('Deploy workflow succeeded.')
    break
  }
  if (i === 39) {
    console.error('Timed out waiting for deploy.')
    process.exit(1)
  }
  await new Promise((r) => setTimeout(r, 15000))
}

console.log('Running production guardrail...')
execSync('npm run ops:guardrail', { stdio: 'inherit' })
console.log('\nLIVE — https://nyumbatracker.vercel.app')
