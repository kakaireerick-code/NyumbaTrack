#!/usr/bin/env node
/** Generate VAPID keys for Web Push (paste into Vercel env). */
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('Add these to Vercel → Production environment:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('VAPID_SUBJECT=mailto:you@domain.com')
console.log('\nThen redeploy and run: npm run check:vapid')
