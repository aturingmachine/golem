import { Errors } from '../errors'
import {
  CommandHandlerFn,
  CommandHandlerFnProps,
  GolemCommand,
  ServiceReqs,
} from '.'

type SubcommandDefinition<T extends ServiceReqs> = {
  name: string | string[]
  handler: CommandHandlerFn<T>
}

export type SubcommandTreeParams<T extends ServiceReqs> = {
  [name: string]: SubcommandDefinition<T>
}

export class SubcommandTree<T extends ServiceReqs> {
  constructor(readonly params: SubcommandTreeParams<T>) {}

  async run(
    command: GolemCommand<T>,
    props: CommandHandlerFnProps,
    ...args: unknown[]
  ): Promise<void> {
    const subcommand = props.source.subCommand

    if (!subcommand) {
      throw Errors.NoSubCommand({
        message: '',
        options: command.info.subcommands?.map((s) => s.name) || [],
        sourceCmd: command.info.name,
      })
    }

    const definition =
      this.params[subcommand]?.handler ||
      Object.values(this.params).find((def) => {
        if (typeof def.name === 'string') {
          return def.name === subcommand
        }

        return def.name.includes(subcommand)
      })

    if (!definition) {
      throw Errors.Basic({
        code: 104,
        message: `No sub-command definition found for ${subcommand}`,
        sourceCmd: command.info.name,
      })
    }

    return definition.call(command, props, ...args)
  }
}
