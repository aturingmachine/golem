export class DiscordMarkdown {
  constructor(public content = '') {}

  static start(content = ''): DiscordMarkdown {
    return new DiscordMarkdown(content)
  }

  raw(content?: string): this {
    this.content = this.content + content

    return this
  }

  newLine(): this {
    this.content = this.content + '\n'

    return this
  }

  bold(textToBold?: string): this {
    const t = textToBold || 'undefined'

    this.content = this.content + `*${t.replaceAll('*', '\\*')}*`

    return this
  }

  italic(textToItalicize?: string): this {
    const t = textToItalicize || 'undefined'
    this.content = this.content + `_${t.replaceAll('_', '\\_')}_`

    return this
  }

  /**
   * Single Backticks
   * @param textToCode
   * @returns
   */
  code(textToCode?: string): this {
    const t = textToCode || 'undefined'
    this.content = this.content + '`' + t.replaceAll('`', '\\`') + '`'

    return this
  }

  /**
   * Triple Backticks
   * @param textToFormat
   * @returns
   */
  preformat(textToFormat?: string): this {
    const t = textToFormat || 'undefined'
    this.content =
      this.content + '```' + t.replaceAll('```', '\\`\\`\\`') + '```'

    return this
  }

  toString(): string {
    return this.content
  }
}
