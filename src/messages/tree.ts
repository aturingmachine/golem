import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CompiledGolemScript, CompiledScriptSegment } from '../ast/compiler'
import { AstParseResult, Parser } from '../ast/parser'
import { CommandHandlerFnProps } from '../commands'
import { Commands } from '../commands/register-commands'
import { LoggerService } from '../core/logger/logger.service'
import { formatForLog } from '../utils/debug-utils'
import { GolemMessage } from './golem-message'
import { ParsedCommand } from './parsed-command'

const SEMI = ';'
const AND = '&&'
const RUN = 'RUN'

export type CommandNodeType = ';' | '&&'

export type CommandNodeLeaf = {
  type: 'RUN'
  command: string
  instance: ParsedCommand
}

export type CommandNodeBranch = {
  type: '&&'
  commands: CommandNodeLeaf[]
  // instance: GolemMessage
}

export type CommandNodeTrunk = {
  type: ';'
  commands: CommandNodes[]
  // instance: GolemMessage
}

export type CommandNodes =
  | CommandNodeLeaf
  | CommandNodeBranch
  | CommandNodeTrunk

export type ExecutionResults = {
  success: string[]
  fail: string[]
  unrun: string[]
  timeline: {
    command: string
    status: 'PASS' | 'FAIL' | 'SKIP'
    instance: ParsedCommand
    // result: BaseReply
  }[]
}

@Injectable()
export class ProcessingTree {
  constructor(private logger: LoggerService) {
    this.logger.setContext('tree-service')
  }

  // TODO make this work with Slash Commands probably?
  treeify(parsed: string): CommandNodes {
    if (parsed.includes(SEMI)) {
      return {
        type: SEMI,
        commands: parsed.split(SEMI).map((m) => this.treeify(m.trim())),
      }
    } else if (parsed.includes(AND)) {
      return {
        type: AND,
        commands: parsed.split(AND).map((m) => this.treeify(m.trim()) as any),
      }
    } else {
      return {
        type: RUN,
        command: parsed,
        instance: ParsedCommand.fromRaw(parsed),
      }
    }
  }

  async runTree(
    innerTree: CommandNodes,
    results: ExecutionResults,
    ref: ModuleRef,
    message?: GolemMessage
  ): Promise<boolean | undefined> {
    if (innerTree.type === SEMI) {
      // Run one after another ignoring fails
      for (const sub of innerTree.commands) {
        await this.runTree(sub, results, ref, message)
      }
    } else if (innerTree.type === AND) {
      // Run one after its prev does not fail
      let canRun = true

      for (const sub of innerTree.commands) {
        if (canRun) {
          canRun = !!(await this.runTree(sub, results, ref, message))
        } else {
          if (sub.type === RUN) {
            results.unrun.push(sub.command)
            results.timeline.push({
              command: sub.command,
              status: 'SKIP',
              instance: sub.instance,
            })
          }
        }
      }
    } else if (innerTree.type === RUN) {
      // Run the command, return the status
      console.log('Should be running using:', innerTree.instance.toDebug())
      console.log(innerTree.instance.handler)

      const status = message
        ? innerTree.instance.handler?.execute({
            module: ref,
            message: message,
            source: innerTree.instance,
          })
        : false

      if (status) {
        results.success.push(innerTree.command)
      } else {
        results.fail.push(innerTree.command)
      }

      results.timeline.push({
        command: innerTree.command,
        status: status ? 'PASS' : 'FAIL',
        instance: innerTree.instance,
      })

      return status
    }
  }

  // async _runTree(
  //   script: CompiledGolemScript,
  //   results: ExecutionResults,
  //   ref: ModuleRef,
  //   message?: GolemMessage
  // ): Promise<boolean | undefined> {
  //   //
  // }

  async runOne(
    segment: CompiledScriptSegment,
    fnProps: CommandHandlerFnProps
  ): Promise<boolean> {
    if (segment.instance.handler) {
      return segment.instance.handler.execute(fnProps)
    } else {
      return false
    }
  }

  async _execute(
    script: CompiledGolemScript,
    message: GolemMessage,
    ref: ModuleRef
  ): Promise<ExecutionResults> {
    const results: ExecutionResults = {
      fail: [],
      success: [],
      unrun: [],
      timeline: [],
    }

    this.logger.debug(`executing segment[0] ${formatForLog(script)}`)

    let lastSegment: [number, 'and_block' | 'solo'] = [
      0,
      script.segments[0].block_type,
    ]
    let canRun = true

    for (const segment of script.segments) {
      const index = segment.index
      console.debug(`Running Segment at index ${index}`)

      // A solo segment can always run so we will reset
      if (
        segment.block_type === 'solo' ||
        (segment.block_type === 'and_block' && lastSegment[1] === 'solo')
      ) {
        console.debug(
          `Running Block Segment type=${segment.block_type}; last segment=[${lastSegment[0]}${lastSegment[1]}]`
        )

        canRun = await this.runOne(segment, {
          message,
          module: ref,
          source: segment.instance,
        })
      }

      // If we are "inside" an and_block we need to check if the last
      // command was an and_block
      if (
        segment.block_type === 'and_block' &&
        lastSegment[0] === index &&
        lastSegment[1] === 'and_block'
      ) {
        console.debug(`Inner AND BLOCK; canRun=${canRun}`)

        // Check canRun
        if (canRun) {
          canRun = await this.runOne(segment, {
            message,
            module: ref,
            source: segment.instance,
          })
        } else {
          // This means we failed a previous command within an and block
          // and we are going to skip the remaining and_block commands.
          results.unrun.push(segment.command)
          results.timeline.push({
            command: segment.command,
            status: 'SKIP',
            instance: segment.instance,
          })

          lastSegment = [index, segment.block_type]

          continue
        }
      }

      if (canRun) {
        results.success.push(segment.command)
      } else {
        results.fail.push(segment.command)
      }

      results.timeline.push({
        command: segment.command,
        status: canRun ? 'PASS' : 'FAIL',
        instance: segment.instance,
      })

      lastSegment = [index, segment.block_type]
    }

    return results
  }

  async execute(
    message: string,
    ref: ModuleRef,
    golemMessage: GolemMessage,
    ast: AstParseResult
  ): Promise<ExecutionResults> {
    this.logger.setMessageContext(golemMessage, 'ProcessingTree')
    this.logger.info(`processing message: ${message}`)
    // const tree = this.treeify(message)

    const tree = {} as any

    const results: ExecutionResults = {
      fail: [],
      success: [],
      unrun: [],
      timeline: [],
    }

    await this.runTree(tree, results, ref, golemMessage)

    results.timeline.forEach((i) => {
      const c = Commands.get(i.command)

      console.log(c?.info.name)
    })

    this.logger.setContext('tree-service')

    return results
  }
}
