#!/usr/bin/env node
/** Check VAPID + push API on production or local preview. */
const base = process.env.VERIFY_BASE_URL || 'https://nyumbatracker.vercel.app'

const urls = [`${base}/api/health`, `${base}/api/push-vapid`]

let ok = true
let healthData = null

for (const url of urls) {
  try {
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))
    if (url.endsWith('/api/health')) healthData = data

    if (url.endsWith('/api/health')) {
      const pass = res.ok && data.ok === true
      console.log(`${pass ? '✓' : '✗'} ${url} → ${JSON.stringify(data)}`)
      if (!data.push) {
        console.log('  hint: set UPSTASH_REDIS_REST_URL + TOKEN on Vercel, then redeploy')
        ok = false
      }
      if (!data.vapid) {
        console.log('  hint: run npm run generate:vapid (or npm run setup:vapid with VERCEL_TOKEN), add VAPID_* to Vercel Production, redeploy')
        ok = false
      }
      continue
    }

    if (url.endsWith('/api/push-vapid')) {
      const configured = Boolean(data.publicKey && data.configured !== false)
      const pass = res.ok && configured
      console.log(`${pass ? '✓' : '✗'} ${url} → ${JSON.stringify(data)}`)
      if (!configured) {
        console.log('  hint: VAPID keys not on server yet — expected until SETUP-VAPID.ps1 is done')
        ok = false
      }
    }
  } catch (e) {
    ok = false
    console.log(`✗ ${url} → ${e.message}`)
  }
}

if (healthData?.push && !healthData?.vapid) {
  console.log('\nPartial: Redis push OK, VAPID missing — tab-hidden notifications work; closed-app push needs VAPID.')
}

process.exit(ok ? 0 : 1)
