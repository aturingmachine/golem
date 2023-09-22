type ValDict = Record<string, string | number | boolean | undefined>

export enum CommandBase {
  admin = 'admin',
  alias = 'alias',
  get = 'get',
  help = 'help',
  mix = 'mix',
  pause = 'pause',
  peek = 'peek',
  perms = 'perms',
  play = 'play',
  playlist = 'playlist',
  playNext = 'playnext',
  report = 'report',
  search = 'search',
  shuffle = 'shuffle',
  skip = 'skip',
  stop = 'stop',
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

export type RawScriptSegment = {
  srcLeaf: AstTokenLeaf
  index: number
  block_type: 'and_block' | 'solo'
  compiled: string
  command: string
  options: ValDict
  variables: ValDict
}

export type ParsedCommand = {
  command: CommandBase
  params: Record<string, string | number | boolean | undefined>
  extendedArgs: Record<string, string | number | boolean | undefined>
  subCommand?: string
}

export type CompiledScriptSegment = RawScriptSegment & {
  instance: ParsedCommand
}

export type CompiledGolemScript = {
  raw: string
  segments: CompiledScriptSegment[]
}

export type EditorCompileError = {
  message: string,
  error?: Error
}

export type EditorCompileResult = {
  ast: AstParseResult
  compiled: CompiledGolemScript
}
