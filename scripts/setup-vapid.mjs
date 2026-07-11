#!/usr/bin/env node
/**
 * Generate VAPID keys and optionally upload to Vercel Production.
 *
 * Env:
 *   VERCEL_TOKEN          — upload env vars + trigger redeploy
 *   VERCEL_PROJECT_ID     — optional (auto-finds nyumba project)
 *   VERCEL_ORG_ID         — team id when project is under a team
 *   VAPID_SUBJECT         — default mailto:admin@nyumbatracker.app
 *   VERIFY_BASE_URL       — default https://nyumbatracker.vercel.app
 *   SKIP_DEPLOY=1         — only set env vars, skip redeploy
 *   SKIP_VERIFY=1         — skip post-deploy check
 */
import { spawn } from 'node:child_process'
import webpush from 'web-push'

const token = process.env.VERCEL_TOKEN?.trim()
const teamId = process.env.VERCEL_ORG_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim()
const projectIdHint = process.env.VERCEL_PROJECT_ID?.trim()
const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@nyumbatracker.app'
const baseUrl = process.env.VERIFY_BASE_URL?.trim() || 'https://nyumbatracker.vercel.app'

const api = async (path, opts = {}) => {
  const url = `https://api.vercel.com${path}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${text}`)
  return data
}

const teamQs = () => (teamId ? `?teamId=${teamId}` : '')

const findProject = async () => {
  if (projectIdHint) return { id: projectIdHint, name: projectIdHint }

  const data = await api(`/v9/projects${teamQs()}`)
  const projects = data.projects || []
  const match =
    projects.find((p) => /nyumba-track/i.test(p.name)) ||
    projects.find((p) => /nyumbatrack/i.test(p.name)) ||
    projects.find((p) =>
      p.targets?.production?.alias?.some?.((a) => String(a).includes('nyumbatracker')),
    )
  if (!match) {
    throw new Error('Could not find NyumbaTrack Vercel project. Set VERCEL_PROJECT_ID.')
  }
  return match
}

const listEnv = async (projectId) => {
  const data = await api(`/v9/projects/${projectId}/env${teamQs()}`)
  return data.envs || data.env || []
}

const upsertEnv = async (projectId, key, value) => {
  const envs = await listEnv(projectId)
  const existing = envs.find((e) => e.key === key && (e.target || []).includes('production'))

  if (existing?.id) {
    await api(`/v9/projects/${projectId}/env/${existing.id}${teamQs()}`, {
      method: 'PATCH',
      body: JSON.stringify({ value, target: ['production'], type: 'encrypted' }),
    })
    console.log(`  updated ${key}`)
    return
  }

  await api(`/v10/projects/${projectId}/env${teamQs()}`, {
    method: 'POST',
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production'],
    }),
  })
  console.log(`  created ${key}`)
}

const triggerDeploy = async (project) => {
  const link = project.link
  if (!link?.repoId) {
    console.log('No git link on project — redeploy manually in Vercel dashboard.')
    return false
  }

  await api(`/v13/deployments${teamQs()}`, {
    method: 'POST',
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      target: 'production',
      gitSource: {
        type: 'github',
        repoId: link.repoId,
        ref: link.productionBranch || 'main',
      },
    }),
  })
  console.log('Production redeploy triggered.')
  return true
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const runCheck = () =>
  new Promise((resolve) => {
    const child = spawn('npm', ['run', 'check:vapid'], {
      stdio: 'inherit',
      env: { ...process.env, VERIFY_BASE_URL: baseUrl },
      shell: true,
    })
    child.on('close', (code) => resolve(code === 0))
  })

const keys = webpush.generateVAPIDKeys()

console.log('NyumbaTrack VAPID setup\n')
console.log('Generated keys:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_SUBJECT=${subject}`)
console.log('')

if (!token) {
  console.log('No VERCEL_TOKEN — paste the three vars into Vercel → Production, redeploy, then:')
  console.log('  npm run check:vapid')
  process.exit(0)
}

console.log('Uploading to Vercel Production...')
const project = await findProject()
console.log(`Project: ${project.name} (${project.id})`)

await upsertEnv(project.id, 'VAPID_PUBLIC_KEY', keys.publicKey)
await upsertEnv(project.id, 'VAPID_PRIVATE_KEY', keys.privateKey)
await upsertEnv(project.id, 'VAPID_SUBJECT', subject)

if (!process.env.SKIP_DEPLOY) {
  const deployed = await triggerDeploy(project)
  if (deployed && !process.env.SKIP_VERIFY) {
    console.log('\nWaiting 90s for deploy...')
    await sleep(90_000)
    console.log('\nRunning check:vapid...')
    const ok = await runCheck()
    process.exit(ok ? 0 : 1)
  }
}

console.log('\nDone. Run: npm run check:vapid')
