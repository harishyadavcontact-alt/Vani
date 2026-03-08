import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const tsconfigPath = join(process.cwd(), 'tsconfig.json')
const raw = readFileSync(tsconfigPath, 'utf8')
const parsed = JSON.parse(raw) as { include?: string[] }

parsed.include = (parsed.include ?? []).filter((entry) => entry !== '.next/types/**/*.ts')

writeFileSync(tsconfigPath, `${JSON.stringify(parsed, null, 2)}\n`)
