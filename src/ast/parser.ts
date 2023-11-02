import { formatForLog } from '../utils/debug-utils'
import { ArrayUtils } from '../utils/list-utils'
import { ASTDebugLogger } from './ast-debug-logger'
import { AstTokens, Tokenizer } from './tokenizer'

export type AstTokenLeaf = {
  tokens: AstTokens[]
  length: number
  command?: AstTokens
}

export type AstTokenTree = Record<number, AstTokenLeaf>

export type AstBlock = {
  raw: string
  type: 'and_block' | 'solo'
  length: number
  commands: AstTokenTree
}

export type AstError = {
  error: Error
  raw: string
}

export type AstParseResult = {
  raw: string
  length: number
  blocks: AstBlock[]
  errors: AstError[]
}

export class Parser {
  readonly result: AstParseResult

  constructor(readonly raw: string, readonly isStrict = false) {
    this.result = this.parse()
  }

  get splits(): string[] {
    return this.raw.split(';')
  }

  private parse(): AstParseResult {
    const errors: AstError[] = []

    const blocks = this.splits
      .map((split) => {
        try {
          return this.parseOne(split)
        } catch (error) {
          errors.push({ error: error as Error, raw: split })
        }
      })
      .filter(ArrayUtils.isDefined)
      .filter((x) => {
        const honk = Object.values(x.commands).flatMap((s) => s.tokens)

        return honk.some((t) => t.type === 'cmd')
      })

    return { raw: this.raw, length: blocks.length, blocks, errors }
  }

  parseOne(section: string): AstBlock {
    ASTDebugLogger.log(`PARSER::parseOne "${section}"`)
    const tokenizer = new Tokenizer(section)
    const type = section.includes('&&') ? 'and_block' : 'solo'
    const prog: AstTokenTree = {}
    let index = 0

    ASTDebugLogger.log(`PARSER::parseOne type=${type}`)

    const get_command = () => {
      const cmd = []
      let iterationCount = 0

      while (!tokenizer.eof()) {
        if (tokenizer.eoc() || iterationCount > 15) {
          ASTDebugLogger.log(`triggering EOC; finishing command`)
          tokenizer.finish_command()
          break
        }

        iterationCount++

        try {
          const next = tokenizer.read_next()
          cmd.push(next)
          ASTDebugLogger.log(`pushing cmd: > ${formatForLog(next || {})}`)
        } catch (error) {
          console.error(error)
          ASTDebugLogger.warn(`could not read; ${error}`)
          throw error
        }
      }

      ASTDebugLogger.log(`cmd done as: "${cmd.join(', ')}"`)

      return cmd
    }

    while (!tokenizer.eof()) {
      const tokens = get_command().filter(Boolean).filter(ArrayUtils.isDefined)
      const commandToken = tokens.find((t) => t.type === 'cmd')

      if (!tokens.length) {
        ASTDebugLogger.log(
          `produced no tokens; current stream peek "${tokenizer.stream.peek()}"`
        )
        break
      }

      prog[index] = { length: tokens.length, command: commandToken, tokens }
      index++
    }

    if (type === 'and_block') {
      const isValid = Object.values(prog).every((s) =>
        s.tokens.some((t) => t.type === 'cmd')
      )

      if (!isValid) {
        if (this.isStrict) {
          throw new Error(
            `ENOCMD: "${this.raw}" "and_block" contains invalid command in chain.`
          )
        }

        return { type, raw: section.trim(), commands: {}, length: 0 }
      }
    }

    Object.values(prog).forEach((x, index) => {
      if (!x.tokens.some((t) => t.type === 'cmd')) {
        delete prog[index]
      }
    })

    if (!Object.values(prog).length && this.isStrict) {
      throw new Error(`ENOCMD: "${this.raw}" contains no valid commands.`)
    }

    const commands = Object.values(prog)

    return {
      type,
      raw: section.trim(),
      commands: prog,
      length: commands.length,
    }
  }
}
