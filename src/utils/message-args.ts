import { Message } from 'discord.js'
import { formatForLog } from './debug-utils'
import { GolemLogger, LogSources } from './logger'

const log = GolemLogger.child({ src: LogSources.ParsedMessage })

const argSeparatorRegexGlobal = / --/g

function getSliceIndex(message: string): number {
  const isAliasCommand = message.includes(' => ')
  const matches = message.match(argSeparatorRegexGlobal) || []

  if (isAliasCommand) {
    return matches.length > 1
      ? message.indexOf(' --', message.indexOf(' -- ') + 1)
      : message.indexOf(' -- ')
  } else {
    return message.indexOf(' -- ')
  }
}

export function parseMessageArgs(message: string): {
  base: string
  args: Record<string, string>
} {
  const spliceIndex = getSliceIndex(message)
  const args = Object.fromEntries(
    message
      .slice(spliceIndex)
      .split(/(?<!"[A-z0-9]*[^ ])\s/)
      .map((argPair) => argPair.split('='))
  )

  return {
    base: spliceIndex > 0 ? message.slice(0, spliceIndex) : message,
    args,
  }
}

/**
 * Parses legacy string commands into content and arguments
 * for easy consumption.
 */
export class ParsedMessage {
  public args: Record<string, string>
  public content: string

  constructor(message: Message | string) {
    const rawContent = typeof message === 'string' ? message : message.content

    const sliceIndex = getSliceIndex(rawContent)

    log.silly(`parsing raw ${formatForLog({ rawContent, sliceIndex })}`)

    this.content = sliceIndex > 0 ? rawContent.slice(0, sliceIndex) : rawContent

    this.args = Object.fromEntries(
      rawContent
        .slice(sliceIndex)
        .split(/(?<!"[A-z0-9 ]*[^ ])\s/g)
        .map((argPair) => argPair.split('='))
    )

    log.silly(`new - ${formatForLog(this)}`)
  }
}
