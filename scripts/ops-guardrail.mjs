#!/usr/bin/env node
/**
 * Production guardrail — fails if nyumbatrack.vercel.app serves stale/wrong app.
 * Run after Vercel redeploy: npm run ops:guardrail
 */

const PROD_URL = process.env.GUARDRAIL_URL || 'https://nyumbatrack.vercel.app'
const STALE_BUNDLE = 'index-B0iUFD94.js'
const KENYA_MARKERS = ['Kenyan Landlords', 'Kenyan landlords']

const checks = []

const pass = (name, detail) => checks.push({ name, ok: true, detail })
const fail = (name, detail) => checks.push({ name, ok: false, detail })

const fetchText = async (path) => {
  const res = await fetch(`${PROD_URL}${path}`, { redirect: 'follow' })
  const text = await res.text()
  return { res, text }
}

const main = async () => {
  console.log(`Guardrail target: ${PROD_URL}\n`)

  try {
    const home = await fetchText('/')
    if (home.text.includes(STALE_BUNDLE)) {
      fail('bundle', `Still serving stale ${STALE_BUNDLE}`)
    } else {
      const match = home.text.match(/index-[A-Za-z0-9_-]+\.js/)
      pass('bundle', match ? `Serving ${match[0]}` : 'No stale bundle marker')
    }

    const kenyaHit = KENYA_MARKERS.find((m) => home.text.includes(m))
    if (kenyaHit) {
      fail('branding', `Kenya copy found: "${kenyaHit}"`)
    } else if (home.text.includes('Uganda') || home.text.includes('NyumbaTrack')) {
      pass('branding', 'Uganda/NyumbaTrack branding present')
    } else {
      fail('branding', 'Expected Uganda landlords copy in page')
    }

    const login = await fetchText('/login')
    if (login.text.includes('404') && login.text.includes('Page not found')) {
      fail('login', '/login returns SPA 404 — wrong deployment')
    } else if (
      login.text.includes('Sign in to manage your rental portfolio') ||
      login.text.includes('NyumbaTrack')
    ) {
      pass('login', '/login serves owner portal')
    } else {
      fail('login', '/login missing owner sign-in copy')
    }

    const health = await fetchText('/api/health')
    try {
      const json = JSON.parse(health.text)
      if (json.ok === true) {
        pass('api/health', `JSON ok=true region=${json.region || 'n/a'}`)
      } else {
        fail('api/health', 'JSON missing ok:true')
      }
    } catch {
      fail('api/health', 'Returns HTML not JSON — API routes not deployed')
    }
  } catch (err) {
    fail('network', err.message || String(err))
  }

  for (const c of checks) {
    console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`)
  }

  const failed = checks.filter((c) => !c.ok)
  console.log(`\n${failed.length ? 'FAIL' : 'PASS'} — ${checks.length - failed.length}/${checks.length} checks`)
  process.exit(failed.length ? 1 : 0)
}

main()
