#!/usr/bin/env node
/** Check VAPID + push API on production or local preview. */
const base = process.env.VERIFY_BASE_URL || 'https://nyumbatracker.vercel.app'
const waitSec = Math.max(0, Number(process.env.WAIT_SECS || 0))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const checkOnce = async () => {
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
          console.log('  hint: run .\\SETUP-VAPID.ps1 or npm run setup:vapid with VERCEL_TOKEN')
          ok = false
        }
        continue
      }

      if (url.endsWith('/api/push-vapid')) {
        const configured = Boolean(data.publicKey && data.configured !== false)
        const pass = res.ok && configured
        console.log(`${pass ? '✓' : '✗'} ${url} → ${JSON.stringify(data)}`)
        if (!configured) {
          console.log('  hint: VAPID keys not on server yet — run SETUP-VAPID.ps1 on your PC')
          ok = false
        }
      }
    } catch (e) {
      ok = false
      console.log(`✗ ${url} → ${e.message}`)
    }
  }

  if (healthData?.push && !healthData?.vapid) {
    console.log('\nPartial: Redis push OK, VAPID missing — tab-hidden alerts work; closed-app needs VAPID.')
  }

  return ok
}

if (waitSec > 0) {
  const deadline = Date.now() + waitSec * 1000
  let attempt = 0
  while (Date.now() < deadline) {
    attempt += 1
    console.log(`\n--- attempt ${attempt} ---`)
    if (await checkOnce()) process.exit(0)
    console.log(`Waiting 15s (${Math.round((deadline - Date.now()) / 1000)}s left)...`)
    await sleep(15_000)
  }
  console.log('\nTimed out — redeploy may still be propagating. Re-run: npm run check:vapid')
  process.exit(1)
}

const ok = await checkOnce()
process.exit(ok ? 0 : 1)
