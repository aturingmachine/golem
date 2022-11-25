import { Commands } from '../commands/register-commands'
import { CommandBase } from '../constants'
import { InputStream } from './input-stream'

export type TokenTypes =
  | 'cmd'
  | 'num'
  | 'str'
  | 'invoker'
  | 'opt'
  | 'var'
  | 'punc'

export type AstToken = {
  type: Exclude<TokenTypes, 'opts' | 'var' | 'cmd'>
  value: string | number
}

export type CmdAstToken = {
  type: 'cmd'
  value: CommandBase
}

export type VarAstToken = {
  type: 'var'
  name: string
  value: string | number
}

export type OptAstToken = {
  type: 'opt'
  name: string
  value: string | number
  opt_val: string
}

export type AstTokens = AstToken | OptAstToken | VarAstToken | CmdAstToken

export class Tokenizer {
  current: AstTokens | undefined | null = null

  command_names = [
    'admin librefresh',
    'alias',
    'get',
    'mix',
    'pause',
    'peek',
    'perms',
    'play',
    'playlist',
    'playnext',
    'report',
    'search',
    'shuffle',
    'skip',
    'stop',
  ]

  keywords = ['$go', ...this.command_names].join(' ')

  readonly stream: InputStream

  constructor(readonly input: string) {
    this.stream = new InputStream(input)
  }

  is_keyword(x: string): boolean {
    return this.keywords.indexOf(' ' + x + ' ') >= 0
  }

  is_command(x: string): boolean {
    return this.command_names.join(' ').indexOf(' ' + x) >= 0
  }

  is_digit(ch: string): boolean {
    console.log(`is_digit@${ch}`)
    return /[0-9]/i.test(ch)
  }

  is_invoker_start(ch: string): boolean {
    return /[\$]/i.test(ch)
  }

  is_id_start(ch: string): boolean {
    return /[%]/i.test(ch)
  }

  is_golem_invoker(ch: string): boolean {
    return (
      this.is_invoker_start(ch) ||
      ('$go $play $stop $pause $playnext'.includes(ch) &&
        !this.is_whitespace(ch))
    )
  }

  is_id(ch: string): boolean {
    return this.is_id_start(ch) || !this.is_whitespace(ch)
  }

  is_option_start(ch: string): boolean {
    return /\-/i.test(ch)
  }

  is_option(ch: string): boolean {
    return this.is_option_start(ch) || !this.is_whitespace(ch)
  }

  is_punc(ch: string): boolean {
    return ',;(){}[]'.indexOf(ch) >= 0
  }

  is_whitespace(ch: string): boolean {
    return ' \t\n'.indexOf(ch) >= 0
  }

  finish_command(): void {
    if (this.eoc()) {
      this.stream.next()

      if (this.stream.peek() === '&') {
        this.stream.next()
      }

      this.read_while(this.is_whitespace.bind(this))
    }
  }

  read_while(predicate: (ch: string) => boolean): string {
    let str = ''

    while (!this.stream.eof() && predicate(this.stream.peek())) {
      str += this.stream.next()
    }

    return str
  }

  read_command(): CmdAstToken | null {
    let cmd_name: CommandBase | string = ''
    let potentials = this.command_names.slice(1)

    while (!this.stream.eof()) {
      const ch = this.stream.peek()

      if (this.is_whitespace(ch) && potentials.length < 1) {
        break
      }

      const potential_new_command = cmd_name + ch

      const new_potentials = potentials.filter((potential) => {
        return new RegExp(`^${potential_new_command}`, 'i').test(potential)
      })

      if (!new_potentials.length) {
        break
      }

      this.stream.next()

      cmd_name = potential_new_command as CommandBase

      potentials = [...new_potentials]
    }

    const base = Commands.get(cmd_name)?.info.name

    if (!base) {
      return null
    }

    return { type: 'cmd', value: base }
  }

  read_number(): AstToken {
    let has_dot = false

    const number = this.read_while((ch) => {
      if (ch == '.') {
        if (has_dot) {
          return false
        }

        has_dot = true

        return true
      }

      return this.is_digit(ch)
    })
    return { type: 'num', value: parseFloat(number) }
  }

  read_escaped(end: string[], skip: string[] = []): string {
    let escaped = false
    let str = this.stream.peek()

    if (str === '"') {
      console.log('read_escaped is quoted')
      end = ['"']
      skip = ['"']
    }

    this.stream.next()
    const skips: string[] = [...skip]

    while (!this.eoc()) {
      const ch = this.stream.next()
      if (escaped) {
        str += ch
        escaped = false
      } else if (ch == '\\') {
        escaped = true
      } else if (end.includes(ch)) {
        if (!skips.includes(ch)) {
          skips.push(ch)
        } else {
          break
        }
        str += ch
      } else {
        str += ch
      }
    }

    return str
  }

  read_string(): AstToken {
    return { type: 'str', value: this.read_escaped(['', ';']) }
  }

  read_invoker(): AstToken | CmdAstToken | null {
    const invoker = this.read_while(this.is_golem_invoker.bind(this))
    console.log('Reading Invoker...', invoker)

    if (invoker !== '$go') {
      console.log(Commands)
      const base = Commands.get(invoker.slice(1))?.info.name
      console.log('Made base:', invoker.slice(1))

      if (!base) {
        return null
      }

      return {
        type: 'cmd',
        value: base,
      }
    }

    return {
      type: 'invoker',
      value: invoker,
    }
  }

  read_option(): OptAstToken {
    const delims = ['', ' ']
    const option = this.read_escaped(delims, ['"'])

    const optName = option.includes('=') ? option.split('=')[0] : option
    const optValue = option.includes('=') ? option.split('=')[1] : true

    return {
      type: 'opt',
      value: option,
      name: optName.replace('--', ''),
      opt_val: optValue.toString().replaceAll('"', ''),
    }
  }

  read_ident(): VarAstToken {
    const id = this.read_while(this.is_id.bind(this))

    return {
      type: 'var',
      value: id,
      name: id.replace('%', ''),
    }
  }

  read_next(): AstTokens | null | undefined {
    // console.log('Read Char:', this.current)
    this.read_while(this.is_whitespace.bind(this))

    if (this.stream.eof()) {
      return null
    }

    const ch = this.stream.peek()

    if (this.is_digit(ch)) {
      return this.read_number()
    }

    if (this.is_invoker_start(ch)) {
      return this.read_invoker()
    }

    if (this.is_option_start(ch)) {
      return this.read_option()
    }

    if (this.is_id_start(ch)) {
      return this.read_ident()
    }

    if (this.is_punc(ch)) {
      return {
        type: 'punc',
        value: this.stream.next(),
      }
    }

    if (this.is_command(ch)) {
      return this.read_command()
    }

    if (ch !== ';') {
      return this.read_string()
    }

    this.stream.croak("Can't handle character: " + ch)
  }

  peek(): AstTokens | null | undefined {
    return this.current || (this.current = this.read_next())
  }

  next(): AstTokens | null | undefined {
    const tok = this.current
    this.current = null

    return tok || this.read_next()
  }

  eof(): boolean {
    return this.stream.peek() === null || this.stream.peek().length === 0
  }

  eoc(): boolean {
    return this.stream.eoc()
  }

  croak(msg: string): void {
    this.stream.croak(msg)
  }
}
