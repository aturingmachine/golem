import { StringUtils } from '../utils/string-utils'

export class ASTParseError extends Error {
  constructor(
    readonly message: string,
    readonly index: number,
    readonly command: string
  ) {
    const m =
      message +
      ` [ERR@ CMD:${index}]` +
      `\n---> ${command}` +
      `\n${StringUtils.repeat(' ', index + 4)}^`

    super(m)
    this.message = m
  }
}

export class ASTUnterminatedQuoteError extends ASTParseError {
  constructor(
    index: number,
    readonly quoteType: 'single' | 'double' | 'backtick',
    readonly command: string
  ) {
    super(
      `Unterminated ${quoteType.toUpperCase()} quote in command.`,
      index,
      command
    )
  }
}
