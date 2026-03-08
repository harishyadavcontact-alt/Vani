import { copyFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status || 1)
}

if (!existsSync('.env.local') && existsSync('.env.example')) {
  copyFileSync('.env.example', '.env.local')
  console.log('Created .env.local from .env.example')
}

run('npm', ['install'])
run('npm', ['run', 'db:migrate'])
run('npm', ['run', 'db:seed'])

console.log('Vani setup complete. Next step: npm run dev')
