import { Commands } from '../commands/register-commands'
import { CommandBase } from '../constants'
import { GolemScriptFunctions } from '../golem-script/functions'
import { ArrayUtils } from '../utils/list-utils'
import { ASTUnterminatedQuoteError } from './ast-parse-error'
import { InputStream } from './input-stream'

const shouldDebug = true

const dd = (...args: unknown[]) => {
  if (shouldDebug) {
    console.log(...args)
  }
}

export type TokenTypes =
  | 'cmd'
  | 'num'
  | 'str'
  | 'invoker'
  | 'opt'
  | 'var'
  | 'punc'
  | 'func'
  | 'alias_def'

export type AstToken = {
  type: Exclude<TokenTypes, 'opts' | 'var' | 'cmd'>
  value: string | number
  insideAlias: boolean
}

export type AliasDefToken = {
  type: 'alias_def'
  value: string
}

export type CmdAstToken = {
  type: 'cmd'
  value: CommandBase
  insideAlias: boolean
}

export type VarAstToken = {
  type: 'var'
  name: string
  value: string | number
  insideAlias: boolean
}

export type FuncAstToken = {
  type: 'func'
  name: string
  value: string
  params: VarAstToken[]
  param_names: string[]
  insideAlias: boolean
}

export type OptAstToken = {
  type: 'opt'
  name: string
  value: string | number
  opt_val: string | FuncAstToken
  insideAlias: boolean
}

export type AstTokens =
  | AstToken
  | OptAstToken
  | VarAstToken
  | CmdAstToken
  | FuncAstToken
  | AliasDefToken

export function isFuncToken(val: AstTokens): val is FuncAstToken {
  return !!val && val.type === 'func'
}

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

  private isInAlias = false
  private hasCommand = false

  constructor(readonly input: string) {
    this.stream = new InputStream(input)
  }

  is_keyword(x: string): boolean {
    return this.keywords.indexOf(' ' + x + ' ') >= 0
  }

  is_command(x: string): boolean {
    return this.command_names.join('|').indexOf('|' + x) >= 0
  }

  is_digit(ch: string): boolean {
    return /[0-9]/i.test(ch)
  }

  is_invoker_start(ch: string): boolean {
    return /^[\$]/i.test(ch)
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

  is_alias_definition_marker_start(ch: string): boolean {
    return /=/i.test(ch)
  }

  is_alias_definition_marker(ch: string): boolean {
    return />/i.test(ch) || this.is_alias_definition_marker_start(ch)
  }

  is_option_start(ch: string): boolean {
    return /\-/i.test(ch) && this.stream.peek_next() === '-'
  }

  is_option(ch: string): boolean {
    return this.is_option_start(ch) || !this.is_whitespace(ch)
  }

  is_function_start(ch: string): boolean {
    return /^:/i.test(ch)
  }

  is_function(ch: string): boolean {
    return this.is_function_start(ch) || !/;/i.test(ch)
  }

  is_punc(ch: string): boolean {
    return ',;(){}'.indexOf(ch) >= 0
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
    // let cmd_name: CommandBase | string = ''
    // let potentials = this.command_names.slice(1)

    const toWhiteSpace = this.stream.peek_to_whitespace()

    // while (!this.stream.eof()) {
    //   const ch = this.stream.peek()
    //   dd(`Checking "${ch}"`)

    //   if (this.is_whitespace(ch) && potentials.length < 1) {
    //     break
    //   }

    //   if (
    //     this.is_whitespace(ch) &&
    //     !potentials.some((potential) => potential.includes(' '))
    //   ) {
    //     break
    //   }

    //   console.log(`Is Command is going to check "${cmd_name + ch}"`)
    //   const potential_new_command = cmd_name + ch

    //   const new_potentials = potentials.filter((potential) => {
    //     return new RegExp(`^${potential_new_command}`, 'i').test(potential)
    //   })

    //   if (!new_potentials.length) {
    //     console.log('Is Command has no new potentials.')
    //     break
    //   }

    //   console.log('Is Command Calling stream.next()')
    //   this.stream.next()

    //   cmd_name = potential_new_command as CommandBase

    //   potentials = [...new_potentials]
    // }

    const base = Commands.get(toWhiteSpace)?.info.name

    if (!base) {
      return null
    }

    this.hasCommand = true

    this.stream.skip_to_whitespace()

    return {
      type: 'cmd',
      value: base.trim() as CommandBase,
      insideAlias: this.isInAlias,
    }
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
    return {
      type: 'num',
      value: parseFloat(number),
      insideAlias: this.isInAlias,
    }
  }

  read_alias_definiton(): AliasDefToken {
    this.isInAlias = true

    const value = this.read_while(() => {
      return !this.stream.eof()
    })

    return {
      type: 'alias_def',
      value,
    }
  }

  read_until(end: string, end_split = ' '): string {
    return this.read_while((ch) => {
      const isEnd = ch === end

      const nextIsEndSplit = this.stream.peek() === end_split

      if (isEnd && nextIsEndSplit) {
        this.stream.next()
      }

      return !isEnd
    })
  }

  read_escaped(
    end: string[],
    skip: string[] = [],
    look_aheads: string[] = [],
    containers: [string, string][] = []
  ): string {
    let escaped = false
    let str = this.stream.peek()
    const quoteState = {
      single: { last: -1, state: false },
      double: { last: -1, state: false },
      tick: { last: -1, state: false },
    }
    const container_state: Record<number, number> = {}

    if (str === '"') {
      end = ['"']
      skip = ['"']
    }

    this.stream.next()
    const skips: string[] = [...skip]

    const insideQuote = () => {
      return (
        quoteState.double.state ||
        quoteState.single.state ||
        quoteState.tick.state
      )
    }

    const insideContainer = () => {
      return Object.values(container_state).some((v) => v !== 0)
    }

    while (!this.eoc()) {
      if (look_aheads.includes(this.stream.peek() + this.stream.peek_next())) {
        break
      }

      const ch = this.stream.next()

      if (!escaped) {
        if (ch === '"') {
          quoteState.double.state = !quoteState.double.state
          quoteState.double.last = this.stream.pos
        } else if (ch === `'`) {
          quoteState.single.state = !quoteState.single.state
          quoteState.single.last = this.stream.pos
        } else if (ch === '`') {
          quoteState.tick.state = !quoteState.tick.state
          quoteState.tick.last = this.stream.pos
        }

        const container_index = containers.findIndex((c) => c.includes(ch))

        if (container_index > -1) {
          const targetContainer = containers[container_index]

          const isClose = targetContainer.indexOf(ch)

          if (isClose) {
            container_state[container_index] =
              container_state[container_index] + 1
          } else {
            container_state[container_index] =
              container_state[container_index] - 1
          }
        }
      }

      if (escaped) {
        str += ch
        escaped = false
      } else if (/\\/.test(ch)) {
        escaped = true
      } else if (end.includes(ch)) {
        if (skips.includes(ch)) {
          if (ch !== ' ' || !this.stream.peek_next()) {
            ArrayUtils.remove(skips, ch)
          }
        } else {
          if (!insideQuote() && !insideContainer()) {
            break
          }
        }
        str += ch
      } else {
        str += ch
      }
    }

    if (quoteState.double.state) {
      throw new ASTUnterminatedQuoteError(
        quoteState.double.last,
        'double',
        this.input
      )
    }
    if (quoteState.single.state) {
      throw new ASTUnterminatedQuoteError(
        quoteState.single.last,
        'single',
        this.input
      )
    }
    if (quoteState.tick.state) {
      throw new ASTUnterminatedQuoteError(
        quoteState.tick.last,
        'backtick',
        this.input
      )
    }

    return str
  }

  read_string(): AstToken {
    return {
      type: 'str',
      value: this.read_escaped(['', ';'], [], ['--', ' :', '=>']).trim(),
      insideAlias: this.isInAlias,
    }
  }

  read_invoker(): AstToken | CmdAstToken | null {
    const invoker = this.read_while(this.is_golem_invoker.bind(this))

    if (invoker !== '$go') {
      const base = Commands.get(invoker.slice(1))?.info.name

      if (!base) {
        return null
      }

      return {
        type: 'cmd',
        value: base.trim() as CommandBase,
        insideAlias: this.isInAlias,
      }
    }

    return {
      type: 'invoker',
      value: invoker.trim(),
      insideAlias: this.isInAlias,
    }
  }

  read_option(): OptAstToken {
    const delims = ['', ' ', '"']
    const option = this.read_escaped(
      delims,
      ['"', '"', '[', ']'],
      ['--'],
      [['[', ']']]
    )

    const optName = option.includes('=') ? option.split('=')[0] : option
    const optValue = option.includes('=') ? option.split('=')[1] : true

    let opt_val: string | FuncAstToken = optValue
      .toString()
      .replace(/^"/g, '')
      .replace(/"$/g, '')
      .trim()

    if (opt_val.startsWith(':[')) {
      const inner_tokenizer = new Tokenizer(opt_val)
      opt_val = inner_tokenizer.read_function()
    }

    return {
      type: 'opt',
      value: option.trim(),
      name: optName.replace('--', '').trim(),
      opt_val: opt_val,
      insideAlias: this.isInAlias,
    }
  }

  read_function(): FuncAstToken {
    const func = this.read_until(']')

    const func_name = func.replace(/^:\[/i, '').slice(0, func.indexOf('(') - 2)

    const func_def = GolemScriptFunctions.get(func_name)

    if (!func_def) {
      throw new Error(`ENOFUNC: "${func_name}" is not a valid function name.`)
    }

    const param_names = func
      .slice(func.indexOf('(') + 1, func.indexOf(')'))
      .split(',')
      .map((s) => s.trim())

    // console.log(param_names)

    const params: VarAstToken[] = param_names.map((p) => ({
      type: 'var',
      value: p,
      name: p,
      insideAlias: this.isInAlias,
    }))

    this.stream.next()

    return {
      type: 'func',
      name: func_name,
      param_names,
      params,
      value: func + ']',
      insideAlias: this.isInAlias,
    }
  }

  read_ident(): VarAstToken {
    const id = this.read_while(this.is_id.bind(this))

    return {
      type: 'var',
      value: id.trim(),
      name: id.replace('%', ''),
      insideAlias: this.isInAlias,
    }
  }

  read_next(): AstTokens | null | undefined {
    this.read_while(this.is_whitespace.bind(this))

    dd('read_next::isInAlias? =>', this.isInAlias)

    if (this.stream.eof() || this.isInAlias) {
      return null
    }

    const ch = this.stream.peek()

    if (this.is_alias_definition_marker(ch)) {
      dd('is_alias_definition_marker', ch)
      return this.read_alias_definiton()
    }

    if (this.is_digit(ch)) {
      dd('is_digit', ch)

      return this.read_number()
    }

    if (this.is_invoker_start(ch)) {
      dd('is_invoker_start', ch)

      return this.read_invoker()
    }

    if (this.is_function_start(ch)) {
      dd('is_function_start')

      return this.read_function()
    }

    if (this.is_option_start(ch)) {
      dd('is_option_start', ch)

      return this.read_option()
    }

    if (this.is_id_start(ch)) {
      dd('is_id_start', ch)

      return this.read_ident()
    }

    if (this.is_punc(ch)) {
      return {
        type: 'punc',
        insideAlias: this.isInAlias,
        value: this.stream.next().trim(),
      }
    }

    if (
      this.is_command(ch) &&
      this.is_command(this.stream.peek_to_whitespace()) &&
      !this.hasCommand &&
      !this.isInAlias
    ) {
      dd('is_command', ch)

      const r = this.read_command()

      dd(r)
      return r
    }

    if (ch !== ';') {
      dd('not a ";"', ch)
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
