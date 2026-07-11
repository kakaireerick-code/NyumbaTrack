#!/usr/bin/env node
/**
 * Lists Vercel teams/projects so you can copy VERCEL_ORG_ID and VERCEL_PROJECT_ID.
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node scripts/vercel-setup-helper.mjs
 */
const token = process.env.VERCEL_TOKEN?.trim()

if (!token) {
  console.error('Missing VERCEL_TOKEN.')
  console.error('Usage: VERCEL_TOKEN=your_token node scripts/vercel-setup-helper.mjs')
  process.exit(1)
}

const api = async (path) => {
  const res = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

const main = async () => {
  console.log('NyumbaTrack Vercel setup helper\n')

  const teams = await api('/v2/teams')
  const user = await api('/v2/user')

  const teamList = teams.teams || []
  console.log('Teams:')
  for (const t of teamList) {
    console.log(`  - ${t.name}  VERCEL_ORG_ID=${t.id}`)
  }

  const personalId = user.user?.defaultTeamId || user.user?.id
  if (personalId) {
    console.log(`\nPersonal / default org: VERCEL_ORG_ID=${personalId}`)
  }

  const orgIds = [...new Set([...teamList.map((t) => t.id), personalId].filter(Boolean))]

  for (const orgId of orgIds) {
    const qs = orgId ? `?teamId=${orgId}` : ''
    const projects = await api(`/v9/projects${qs}`)
    const list = projects.projects || []
    if (!list.length) continue

    console.log(`\nProjects (org ${orgId}):`)
    for (const p of list) {
      const match =
        /nyumba/i.test(p.name) ||
        p.name?.toLowerCase().includes('nyumbatrack') ||
        (p.targets?.production?.alias?.some?.((a) => a.includes('nyumbatrack')) ?? false)
      const star = match ? ' ★ likely NyumbaTrack' : ''
      console.log(`  - ${p.name}`)
      console.log(`    VERCEL_PROJECT_ID=${p.id}${star}`)
      if (p.link?.repo) console.log(`    Git: ${p.link.org}/${p.link.repo}`)
    }
  }

  console.log('\n--- Add to GitHub Secrets (Actions) ---')
  console.log('VERCEL_TOKEN        = (your token)')
  console.log('VERCEL_ORG_ID       = (from above)')
  console.log('VERCEL_PROJECT_ID   = (nyumbatrack project ★)')
  console.log('\nThen: Actions → Deploy to Vercel → Run workflow → main')
  console.log('Finally: npm run ops:guardrail')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
