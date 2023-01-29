import { ArrayUtils } from '../utils/list-utils'

type GolemFunctionDef = {
  name: string
  implementation: Function
  params: string[]
  param_count?: number
}

function random<T>(...args: T[]): T {
  return ArrayUtils.shuffleArray(args)[0]
}

function range(...args: [number, number]): number {
  return Math.random() * (args[1] - args[0]) + args[0]
}

function forEach(list: string[], command: string): void {
  //
}

/**
 * Functions in GS are denoted by a colon, and wrapped in square
 * brackets.
 *
 * @example
 * // Execute function 'random' with params "1, 2, 3"
 * :[random(1, 2, 3)]
 */
const _functions: Record<string, GolemFunctionDef> = {
  random: {
    name: 'random',
    implementation: random,
    params: ['T[]'],
  },

  range: {
    name: 'range',
    implementation: range,
    params: ['number', 'number'],
    param_count: 2,
  },
}

export class GolemScriptFunctions {
  static get(fnName: string): GolemFunctionDef | undefined {
    return _functions[fnName]
  }
}
