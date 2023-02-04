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
  ): Promise<boolean> {
    const subcommand = props.source.subCommand

    if (!subcommand) {
      return false
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
      return false
    }

    return definition.call(command, props, ...args)
  }
}
