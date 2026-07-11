#!/usr/bin/env node
/** Generate VAPID keys for Web Push — saves to vapid-keys.local (gitignored). */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import webpush from 'web-push'

const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@nyumbatracker.app'
const keys = webpush.generateVAPIDKeys()
const lines = [
  `VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  `VAPID_SUBJECT=${subject}`,
  '',
  '# Paste into Vercel → nyumbatrack → Settings → Environment Variables → Production',
  '# Then Redeploy production and run: npm run check:vapid',
]

const outPath = join(process.cwd(), 'vapid-keys.local')
writeFileSync(outPath, lines.join('\n'), 'utf8')

console.log('NyumbaTrack VAPID keys generated\n')
for (const line of lines.slice(0, 3)) console.log(line)
console.log(`\nSaved to: ${outPath} (gitignored — keep private)`)
console.log('\nVercel dashboard:')
console.log('  https://vercel.com/dashboard → nyumbatrack → Settings → Environment Variables')
console.log('\nAfter redeploy (~2 min): npm run check:vapid')
