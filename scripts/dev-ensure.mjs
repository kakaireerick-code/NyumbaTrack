#!/usr/bin/env node
/**
 * Ensures dependencies are installed and starts Vite on http://localhost:5173
 */
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd: root, ...opts })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })

if (!existsSync(viteBin)) {
  console.log('Installing dependencies…')
  await run('npm', ['install'])
}

console.log('Starting dev server at http://localhost:5173')
await run('node', [viteBin, '--port', '5173', '--strictPort', '--host', '127.0.0.1'])
