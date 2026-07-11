/**
 * Shared Vercel VAPID env upload helpers.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const KEYS_FILE = 'vapid-keys.local'
export const PROD_URL = process.env.VERIFY_BASE_URL?.trim() || 'https://nyumbatracker.vercel.app'

export const parseVapidKeysFile = (filePath = join(process.cwd(), KEYS_FILE)) => {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${KEYS_FILE} — run: npm run generate:vapid`)
  }
  const text = readFileSync(filePath, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^(VAPID_[A-Z_]+)=(.+)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  const required = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']
  const missing = required.filter((k) => !out[k])
  if (missing.length) {
    throw new Error(`${KEYS_FILE} missing: ${missing.join(', ')}`)
  }
  return {
    publicKey: out.VAPID_PUBLIC_KEY,
    privateKey: out.VAPID_PRIVATE_KEY,
    subject: out.VAPID_SUBJECT,
  }
}

export const createVercelClient = () => {
  const token = process.env.VERCEL_TOKEN?.trim()
  if (!token) throw new Error('VERCEL_TOKEN required — get one at https://vercel.com/account/tokens')

  const teamId = process.env.VERCEL_ORG_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim()
  const projectIdHint = process.env.VERCEL_PROJECT_ID?.trim()
  const teamQs = () => (teamId ? `?teamId=${teamId}` : '')

  const api = async (path, opts = {}) => {
    const res = await fetch(`https://api.vercel.com${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`${path} → ${res.status}: ${text}`)
    return text ? JSON.parse(text) : {}
  }

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
    if (!match) throw new Error('Could not find NyumbaTrack project. Set VERCEL_PROJECT_ID.')
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
      console.log(`  updated ${key} on Production`)
      return
    }
    await api(`/v10/projects/${projectId}/env${teamQs()}`, {
      method: 'POST',
      body: JSON.stringify({ key, value, type: 'encrypted', target: ['production'] }),
    })
    console.log(`  created ${key} on Production`)
  }

  const verifyProductionKeys = async (projectId, keys = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) => {
    const envs = await listEnv(projectId)
    const onProd = new Set(
      envs.filter((e) => (e.target || []).includes('production')).map((e) => e.key),
    )
    const missing = keys.filter((k) => !onProd.has(k))
    return { ok: missing.length === 0, missing, present: [...onProd].filter((k) => keys.includes(k)) }
  }

  const triggerDeploy = async (project) => {
    const link = project.link
    if (!link?.repoId) {
      console.log('No git link — redeploy manually in Vercel dashboard.')
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

  return { findProject, upsertEnv, verifyProductionKeys, triggerDeploy }
}

export const fetchProductionHealth = async () => {
  const res = await fetch(`${PROD_URL}/api/health`)
  return res.json()
}

export const formatMissingVapidEnv = (vapidEnv) => {
  if (!vapidEnv) return []
  const labels = {
    publicKey: 'VAPID_PUBLIC_KEY',
    privateKey: 'VAPID_PRIVATE_KEY',
    subject: 'VAPID_SUBJECT',
  }
  return Object.entries(vapidEnv)
    .filter(([, v]) => !v)
    .map(([k]) => labels[k] || k)
}
