import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { CompiledGolemScript, CompiledScriptSegment } from '../ast/compiler'
import { CommandHandlerFnProps } from '../commands'
import { Commands } from '../commands/register-commands'
import { ClientService } from '../core/client.service'
import { LoggerService } from '../core/logger/logger.service'
import { GolemError } from '../errors/golem-error'
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
  constructor(
    private logger: LoggerService,
    private clientService: ClientService,
    private config: ConfigService
  ) {
    this.logger.setContext('TreeService')
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
      let status = true

      // client.users.send('id', 'content');
      if (!!message) {
        try {
          innerTree.instance.handler?.execute({
            message: message,
            source: innerTree.instance,
          })

          status = true
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          this.logger.error(
            error.message,
            error.stack,
            `TreeService::${innerTree.instance.handler?.options.logSource}::${message.traceId}`
          )

          status = false

          // Render the error reply onto the reply stack if
          // it has not already been rendered.
          await message.addError(error)

          /**
           * If the error is flagged as requiring admin
           * attention we should send a DM to the admin.
           */
          if (
            GolemError.is(error) &&
            error.params.requiresAdminAttention &&
            this.clientService.client &&
            this.config.get('discord.adminId')
          ) {
            await this.clientService.client.users.send(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              this.config.get('discord.adminId')!,
              (
                await error.toMessage()
              ).opts
            )
          }
        }
      } else {
        status = false
      }

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

  async runOne(
    segment: CompiledScriptSegment,
    fnProps: CommandHandlerFnProps
  ): Promise<void> {
    if (segment.instance.handler) {
      await segment.instance.handler.execute(fnProps)
    } else {
      throw new Error('TODO')
    }
  }

  async _execute(
    script: CompiledGolemScript,
    message: GolemMessage
  ): Promise<ExecutionResults> {
    const results: ExecutionResults = {
      fail: [],
      success: [],
      unrun: [],
      timeline: [],
    }

    this.logger.debug(
      `executing segment[0] "${script.raw}" ${formatForLog(script)}`
    )

    let lastSegment: [number, 'and_block' | 'solo'] = [
      0,
      script.segments[0].block_type,
    ]
    let canRun = true

    for (const segment of script.segments) {
      const index = segment.index

      // A solo segment can always run so we will reset
      if (
        segment.block_type === 'solo' ||
        (segment.block_type === 'and_block' && lastSegment[1] === 'solo')
      ) {
        try {
          await this.runOne(segment, {
            message,
            source: segment.instance,
          })
          canRun = true
        } catch (error) {
          canRun = false
          throw error
        }
      }

      // If we are "inside" an and_block we need to check if the last
      // command was an and_block
      if (
        segment.block_type === 'and_block' &&
        lastSegment[0] === index &&
        lastSegment[1] === 'and_block'
      ) {
        // Check canRun
        if (canRun) {
          try {
            await this.runOne(segment, {
              message,
              source: segment.instance,
            })
            canRun = true
          } catch (error) {
            canRun = false
            throw error
          }
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
    golemMessage: GolemMessage
  ): Promise<ExecutionResults> {
    this.logger.setMessageContext(golemMessage, 'ProcessingTree')
    this.logger.info(`processing message: ${message}`)

    const tree = {} as CommandNodes

    const results: ExecutionResults = {
      fail: [],
      success: [],
      unrun: [],
      timeline: [],
    }

    await this.runTree(tree, results, ref, golemMessage)

    this.logger.setContext('tree-service')

    return results
  }
}
