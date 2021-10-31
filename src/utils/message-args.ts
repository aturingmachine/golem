import { Interaction, Message } from 'discord.js'

export function parseMessageArgs(message: string): {
  base: string
  args: Record<string, string>
} {
  const args = Object.fromEntries(
    message
      .slice(message.indexOf(' -- '))
      .split(' ')
      .map((argPair) => argPair.split('='))
  )

  return {
    base:
      message.indexOf(' -- ') > 0
        ? message.slice(0, message.indexOf(' -- '))
        : message,
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

    this.content =
      rawContent.indexOf(' -- ') > 0
        ? rawContent.slice(0, rawContent.indexOf(' -- '))
        : rawContent

    this.args = Object.fromEntries(
      rawContent
        .slice(rawContent.indexOf(' -- '))
        .split(' ')
        .map((argPair) => argPair.split('='))
    )
  }
}
