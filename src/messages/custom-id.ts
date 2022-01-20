import { CommandBase } from '../constants'
import { ButtonIdPrefixes, SelectMenuId } from '../handlers/button-handler'

type InteractionIdPrefixes = ButtonIdPrefixes | SelectMenuId

export type CustomIdConfig<P extends InteractionIdPrefixes> = {
  type: P
  command: CommandBase | '__CUSTOM__'
  args: Record<string, unknown>
}

export class CustomId<P extends InteractionIdPrefixes> {
  constructor(public config: CustomIdConfig<P>) {}

  toString(): string {
    return Object.entries(this.flat).reduce((prev, curr) => {
      return prev.concat(`${curr[0]}=${curr[1]};`)
    }, '')
  }

  static fromString<T extends InteractionIdPrefixes>(
    idString: string
  ): CustomId<T> {
    const config: Record<string, any> = {
      args: {},
    }

    idString
      .split(';')
      .map((property) => property.split('='))
      .forEach(([key, val]) => {
        if (key === 'type' || key === 'command') {
          config[key] = val
        } else {
          config.args[key] = val
        }
      })

    if (!config.type || !config.command) {
      throw new Error(
        `Invalid customId string - required options [type, command] - ${idString}`
      )
    }

    return new CustomId(config as CustomIdConfig<T>)
  }

  private get flat(): Record<string, unknown> {
    return {
      type: this.config.type,
      command: this.config.command,
      ...this.config.args,
    }
  }
}
