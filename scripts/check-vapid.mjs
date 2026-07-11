#!/usr/bin/env node
/** Check VAPID + push API on production or local preview. */
const base = process.env.VERIFY_BASE_URL || 'https://nyumbatracker.vercel.app'

const urls = [`${base}/api/health`, `${base}/api/push-vapid`]

let ok = true
for (const url of urls) {
  try {
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))
    const pass = res.ok
    console.log(`${pass ? '✓' : '✗'} ${url} → ${JSON.stringify(data)}`)
    if (url.endsWith('/api/health') && (!data.vapid || !data.push)) {
      console.log('  hint: set VAPID_* env vars and UPSTASH_REDIS on Vercel, then redeploy')
      ok = false
    }
    if (url.endsWith('/api/push-vapid') && !data.publicKey) ok = false
  } catch (e) {
    ok = false
    console.log(`✗ ${url} → ${e.message}`)
  }
}

process.exit(ok ? 0 : 1)
