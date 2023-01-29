import { writeFileSync } from 'fs'
import path from 'path'

export function debugDump(...args: unknown[]): void {
  const out = path.resolve(__dirname, '../out.json')
  writeFileSync(out, JSON.stringify(args, undefined, 2), { encoding: 'utf-8' })
}
