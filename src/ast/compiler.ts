import { GolemScriptFunctions } from '../golem-script/functions'
import { ParsedCommand } from '../messages/parsed-command'
import { formatForLog } from '../utils/debug-utils'
import { ArrayUtils } from '../utils/list-utils'
import { AstParseResult, AstTokenLeaf, Parser } from './parser'
import { AstTokens, FuncAstToken, OptAstToken, VarAstToken } from './tokenizer'

type ValDict = Record<string, string | number | boolean | undefined>

type CompileTokenResult = {
  raw: string
  name: string
  resolved_value: string | number | boolean
}

export type RawScriptSegment = {
  srcLeaf: AstTokenLeaf
  index: number
  block_type: 'and_block' | 'solo'
  compiled: string
  command: string
  options: ValDict
  variables: ValDict
}

export type CompiledScriptSegment = RawScriptSegment & {
  instance: ParsedCommand
}

export type CompiledGolemScript = {
  raw: string
  segments: CompiledScriptSegment[]
}

export class GSCompiler {
  private readonly tokens: ValDict = {}
  private readonly delayedEval: { token: AstTokens; index: number }[] = []
  private readonly dividers: RegExpMatchArray[]
  private readonly segments: CompiledScriptSegment[] = []

  private currentSegment: RawScriptSegment = {
    srcLeaf: {} as AstTokenLeaf,
    index: -1,
    command: '',
    compiled: '',
    block_type: 'solo',
    options: {},
    variables: {},
  }

  constructor(readonly ast: AstParseResult) {
    this.dividers = Array.from(this.ast.raw.matchAll(/;|(?:&&)/gi))
  }

  static fromString(source: string): {
    ast: AstParseResult
    compiled: CompiledGolemScript
  } {
    const ast = new Parser(source).result
    const compiled = new GSCompiler(ast).compile()

    return {
      ast,
      compiled,
    }
  }

  compile(): CompiledGolemScript {
    console.debug(`GS::compile processing ast.raw="${this.ast.raw}"`)

    const raw = this.ast.blocks
      .flatMap((block, blockIndex) => {
        return Object.values(block.commands).flatMap((leaf, _index) => {
          this.updateCurrentSegment('srcLeaf', leaf)
          this.updateCurrentSegment('index', blockIndex)
          this.updateCurrentSegment('block_type', block.type)

          const tokens = this.compileTokens(leaf)

          this.updateCurrentSegment('compiled', tokens)
          this.pushCurrentSegment()

          return tokens
        })
      })
      .join(' ')

    return {
      raw,
      segments: this.segments,
    }
  }

  private compileTokens(leaf: AstTokenLeaf): string {
    const compiled = leaf.tokens.flatMap((token, index) => {
      return this.compileLeaf(token, index)
    })

    let prevDelayed = this.delayedEval.map((delayed) => ({ ...delayed }))
    let delayedEvalLoops = 0

    if (this.delayedEval.length) {
      while (this.delayedEval.length > 0) {
        const next = this.delayedEval.pop()

        const isLooping = prevDelayed.every((prev) => {
          return !!this.delayedEval.find((delayed) => {
            return (
              prev.index === delayed.index &&
              Object.entries(delayed.token).every(
                ([key, val]) => prev.token[key as keyof AstTokens] === val
              )
            )
          })
        })

        if (!next || isLooping || delayedEvalLoops > 5) {
          continue
        }

        const resolved = this.compileLeaf(next.token, next.index)

        if (resolved) {
          compiled[next.index] = resolved
        }

        prevDelayed = this.delayedEval.map((delayed) => ({ ...delayed }))
        delayedEvalLoops++
      }
    }

    return compiled
      .filter(ArrayUtils.isDefined)
      .map((c) => c.resolved_value)
      .concat(this.dividers.shift()?.[0] || '')
      .join(' ')
  }

  private compileLeaf(
    token: AstTokens,
    index: number
  ): CompileTokenResult | undefined {
    let result: CompileTokenResult | undefined
    console.debug(`GS::compileLeaf > compiling leaf ${formatForLog(token)}`)

    switch (token.type) {
      case 'cmd':
        this.updateCurrentSegment('command', token.value)
        result = {
          name: token.type,
          raw: token.value,
          resolved_value: token.value,
        }
        break
      case 'func':
        result = this.compileFunctionLeaf(token as FuncAstToken)
        break
      case 'opt':
        result = this.compileOptLeaf(token as OptAstToken)
        this.updateCurrentSegment('options', {
          [result.name]: result.resolved_value,
        })
        break
      case 'var':
        result = this.compileVarLeaf(token, index)

        if (result) {
          console.debug(
            `token ${token.value} using value ${result.resolved_value}`
          )
          this.updateCurrentSegment('variables', {
            [result.name]: result.resolved_value,
          })
        } else {
          console.debug(`token ${token.value} missed`)
        }

        break
      case 'alias_def':
        result = {
          raw: token.value.toString(),
          name: 'alias_def',
          resolved_value: token.value.toString(),
        }
        break
      default:
        result = {
          name: token.type,
          raw: token.value.toString(),
          resolved_value: token.value.toString(),
        }
        break
    }

    return result
  }

  private compileVarLeaf(
    token: VarAstToken,
    index: number
  ): CompileTokenResult | undefined {
    const existing = this.tokens[token.name]

    if (existing) {
      console.debug(
        `token ${token.value} found existing ${existing.toString()}`
      )
      return {
        raw: token.value.toString(),
        name: token.name,
        resolved_value: existing.toString(),
      }
    }

    this.delayedEval.push({ token, index })
  }

  private compileFunctionLeaf(token: FuncAstToken): CompileTokenResult {
    console.debug(
      `GS:compileFunctionLeaf > compiling token "${formatForLog(token)}"`
    )
    const def = GolemScriptFunctions.get(token.name)
    let evaled = token.value

    if (!token.insideAlias) {
      console.debug(`GS:compileFunctionLeaf > evaling GS function ${def?.name}`)
      evaled = def?.implementation(...token.params.map((p) => p.value))
      console.debug(`GS:compileFunctionLeaf > evaled to ${evaled}`)
    } else {
      console.debug(
        `GS:compileFunctionLeaf > inside alias, no eval "${evaled}"`
      )
    }

    return {
      raw: token.value,
      name: token.name,
      resolved_value: evaled,
    }
  }

  private compileOptLeaf(token: OptAstToken): CompileTokenResult {
    const val: string | boolean | number | FuncAstToken = token.opt_val

    console.debug(`CommandInvocation::constructor mapping val="${val}"`)

    // Handle nested Function Call
    if (typeof val === 'object') {
      const evaluated = this.compileFunctionLeaf(val)

      this.tokens[token.name] = evaluated.resolved_value

      const evaled = token.value
        .toString()
        .replace(val.value, `"${evaluated.resolved_value}"`)

      return {
        raw: token.value.toString(),
        name: token.name,
        resolved_value: evaled,
      }
    }

    const isBool = ['false', 'true'].includes(val)
    const isNumber = !isNaN(parseInt(val))

    this.tokens[token.name] = val

    if (isBool) {
      this.tokens[token.name] = token.opt_val === 'true'
    } else if (isNumber) {
      this.tokens[token.name] = parseInt(val)
    }

    return {
      raw: token.opt_val.toString(),
      name: token.name,
      resolved_value: val,
    }
  }

  private pushCurrentSegment(): void {
    this.segments.push({
      ...this.currentSegment,
      instance: ParsedCommand.fromSegment(this.currentSegment),
    })
    this.resetCurrentSegment()
  }

  private updateCurrentSegment<K extends keyof RawScriptSegment>(
    key: K,
    value: RawScriptSegment[K]
  ): void {
    if (['options', 'variables'].includes(key)) {
      ;(this.currentSegment as any)[key] = {
        ...(this.currentSegment[key] as ValDict),
        ...(value as ValDict),
      }
    } else {
      this.currentSegment[key] = value
    }
  }

  private resetCurrentSegment(): void {
    this.currentSegment = {
      srcLeaf: {} as AstTokenLeaf,
      index: -1,
      block_type: 'solo',
      compiled: '',
      command: '',
      options: {},
      variables: {},
    }
  }
}
