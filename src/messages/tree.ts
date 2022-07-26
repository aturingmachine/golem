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
export class TreeService {
  constructor(private logger: LoggerService) {
    this.logger.setContext('tree-service')
  }

  // This is for testing this shit
  run(command: string): boolean {
    // console.log('Running command:', command)
    const pass = Math.random() <= 0.7

    if (!pass) {
      // console.log('Failing command:', command)
    } // else {
    //   console.log('Passing command', command)
    // }

    return pass
  }

  treeify(msg: string): CommandNodes {
    if (msg.includes(SEMI)) {
      // console.log(SEMI, msg)
      return {
        type: SEMI,
        commands: msg.split(SEMI).map((m) => this.treeify(m.trim())),
      }
    } else if (msg.includes(AND)) {
      // console.log(AND, msg)
      return {
        type: AND,
        commands: msg.split(AND).map((m) => this.treeify(m.trim()) as any),
      }
    } else {
      // console.log(RUN, msg)
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
    ref: ModuleRef
  ): Promise<boolean | undefined> {
    // console.log('RUNNING TREE', innerTree)
    if (innerTree.type === SEMI) {
      // console.log(SEMI, innerTree)
      // Run one after another ignoring fails
      for (const sub of innerTree.commands) {
        this.runTree(sub, results, ref)
      }
    } else if (innerTree.type === AND) {
      // console.log(AND, innerTree)
      // Run one after its prev does not fail
      let canRun = true

      for (const sub of innerTree.commands) {
        if (canRun) {
          canRun = !!(await this.runTree(sub, results, ref))
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
      // console.log(RUN, innerTree)
      // Run the command, return the status
      // TODO use real implementation
      const status = this.run(innerTree.command)
      // Commands.get()

      if (status) {
        // console.log('runTree ran and passed', innerTree.command)
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

  async execute(message: string, ref: ModuleRef): Promise<ExecutionResults> {
    const tree = this.treeify(message)

    console.log(JSON.stringify(tree))

    const results: ExecutionResults = {
      fail: [],
      success: [],
      unrun: [],
      timeline: [],
    }

    await this.runTree(tree, results, ref)

    console.log(JSON.stringify(Commands))

    results.timeline.forEach((i) => {
      const c = Commands.get(i.command)

      console.log(c?.info.name)
    })

    return results
  }
}
