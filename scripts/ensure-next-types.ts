import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

const root = process.cwd()
const appDir = join(root, 'app')
const outDir = join(root, '.next', 'types', 'app')

function walk(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }

    if (!/\.(ts|tsx)$/.test(entry)) continue
    if (!/(page|layout|route|manifest)\.(ts|tsx)$/.test(entry)) continue
    files.push(fullPath)
  }

  return files
}

for (const file of walk(appDir)) {
  const relativePath = relative(appDir, file).replace(/\.(tsx|ts)$/, '.ts')
  const target = join(outDir, relativePath)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, 'export {}\n')
}

const packageJsonPath = join(root, '.next', 'types', 'package.json')
  ;mkdirSync(dirname(packageJsonPath), { recursive: true })
writeFileSync(packageJsonPath, '{\n  "type": "module"\n}\n')
