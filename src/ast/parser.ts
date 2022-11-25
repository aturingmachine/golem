import { ArrayUtils } from '../utils/list-utils'
import { AstTokens, Tokenizer } from './tokenizer'

export type AstTokenLeaf = { tokens: AstTokens[] }

export type AstTokenTree = Record<number, AstTokenLeaf>

export type AstBlock = {
  type: 'and_block' | 'solo'
  commands: AstTokenTree
}

export class Parser {
  constructor(readonly raw: string) {}

  get splits(): string[] {
    return this.raw.split(';')
  }

  parse(): AstBlock[] {
    return this.splits.map((split) => this.parseOne(split))
  }

  parseOne(section: string): AstBlock {
    const tokenizer = new Tokenizer(section)
    const prog: Record<number, { tokens: AstTokens[] }> = {}
    const type = section.includes('&&') ? 'and_block' : 'solo'
    let index = 0

    const get_command = () => {
      const cmd = []

      while (!tokenizer.eof()) {
        if (tokenizer.eoc()) {
          tokenizer.finish_command()
          break
        }

        console.log('Parsing Command Token at Index:', cmd.length)
        try {
          const next = tokenizer.read_next()
          cmd.push(next)
        } catch (error) {
          console.error(error)
          console.log(cmd)
          throw error
        }
      }

      return cmd
    }

    while (!tokenizer.eof()) {
      prog[index] = { tokens: get_command().filter(ArrayUtils.isDefined) }
      index++
    }

    return { type, commands: prog }
  }
}
