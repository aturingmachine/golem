const SEMI = ';'
const AND = '&&'
const RUN = 'RUN'

export type CommandNodeType = ';' | '&&'

export type CommandNodeLeaf = {
  type: 'RUN'
  command: string
}

export type CommandNodeBranch = {
  type: '&&'
  commands: CommandNodeLeaf[]
}

export type CommandNodeTrunk = {
  type: ';'
  commands: CommandNodes[]
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
  }[]
}

function run(command: string): boolean {
  // console.log('Running command:', command)
  const pass = Math.random() <= 0.7

  if (!pass) {
    // console.log('Failing command:', command)
  } // else {
  //   console.log('Passing command', command)
  // }

  return pass
}

function treeify(msg: string): CommandNodes {
  if (msg.includes(SEMI)) {
    // console.log(SEMI, msg)
    return {
      type: SEMI,
      commands: msg.split(SEMI).map((m) => treeify(m.trim())),
    }
  } else if (msg.includes(AND)) {
    // console.log(AND, msg)
    return {
      type: AND,
      commands: msg.split(AND).map((m) => treeify(m.trim()) as any),
    }
  } else {
    // console.log(RUN, msg)
    return { type: RUN, command: msg }
  }
}

async function runTree(
  innerTree: CommandNodes,
  results: ExecutionResults
): Promise<boolean | undefined> {
  // console.log('RUNNING TREE', innerTree)
  if (innerTree.type === SEMI) {
    // console.log(SEMI, innerTree)
    // Run one after another ignoring fails
    for (const sub of innerTree.commands) {
      runTree(sub, results)
    }
  } else if (innerTree.type === AND) {
    // console.log(AND, innerTree)
    // Run one after its prev does not fail
    let canRun = true

    for (const sub of innerTree.commands) {
      if (canRun) {
        canRun = !!(await runTree(sub, results))
      } else {
        if (sub.type === RUN) {
          results.unrun.push(sub.command)
          results.timeline.push({ command: sub.command, status: 'SKIP' })
        }
      }
    }
  } else if (innerTree.type === RUN) {
    // console.log(RUN, innerTree)
    // Run the command, return the status
    // TODO use real implementation
    const status = run(innerTree.command)

    if (status) {
      // console.log('runTree ran and passed', innerTree.command)
      results.success.push(innerTree.command)
    } else {
      results.fail.push(innerTree.command)
    }

    results.timeline.push({
      command: innerTree.command,
      status: status ? 'PASS' : 'FAIL',
    })

    return status
  }
}

export async function execute(message: string): Promise<ExecutionResults> {
  const tree = treeify(message)

  const results: ExecutionResults = {
    fail: [],
    success: [],
    unrun: [],
    timeline: [],
  }

  await runTree(tree, results)

  return results
}
