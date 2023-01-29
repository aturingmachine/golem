import { appendFileSync } from 'fs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatForLog = (obj: Record<string, any>): string => {
  const missing = processMissing(obj)

  return (
    missing ||
    Object.entries(obj).reduce((prev, curr) => {
      const missing = processMissing(curr[1])
      const isObj = typeof curr[1] === 'object' && !Array.isArray(curr[1])

      const stringifiedValue =
        missing || isObj ? `{ ${formatForLog(curr[1])} }` : curr[1]

      const message = `${curr[0]}=${stringifiedValue}; `

      return prev.concat(message)
    }, '')
  )
}

const processMissing = (val: unknown): string | undefined => {
  if (val === null) {
    return 'NULL '
  }

  if (val === undefined) {
    return 'UNDEFINED '
  }
}

export function logfile(message: string, ...optionalParams: any[]): void {
  appendFileSync(
    './logfile',
    [message].concat(...optionalParams).join(' ') + '\n',
    { encoding: 'utf-8' }
  )
}
