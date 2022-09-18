import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Commands } from '../commands/register-commands'
import { LoggerService } from '../core/logger/logger.service'
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

  treeify(msg: string): CommandNodes {
    if (msg.includes(SEMI)) {
      return {
        type: SEMI,
        commands: msg.split(SEMI).map((m) => this.treeify(m.trim())),
      }
    } else if (msg.includes(AND)) {
      return {
        type: AND,
        commands: msg.split(AND).map((m) => this.treeify(m.trim()) as any),
      }
    } else {
      return {
        type: RUN,
        command: msg,
        instance: ParsedCommand.fromRaw(msg),
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
        ? innerTree.instance.handler?.execute(ref, message, innerTree.instance)
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

  async execute(
    message: string,
    ref: ModuleRef,
    golemMessage: GolemMessage
  ): Promise<ExecutionResults> {
    this.logger.setMessageContext(golemMessage, 'ProcessingTree')
    this.logger.info(`processing message: ${message}`)
    const tree = this.treeify(message)
    // console.log(JSON.stringify(tree))

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
