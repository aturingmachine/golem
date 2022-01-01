import { MessageSelectMenu, MessageSelectOptionData } from 'discord.js'
import { SelectMenuId } from '../handlers/button-handler'
import { CustomId, CustomIdConfig } from './custom-id'
import { ParsedCommand } from './parsed-command'

type SelectMenuConfig = {
  customId: CustomIdConfig<SelectMenuId>
  options?: MessageSelectOptionData[]
  placeholder?: string
}

/**
 * Represents a SelectMenu that is designed as a Golem Command
 */
export class SelectMenu {
  constructor(public config: SelectMenuConfig) {}

  get customId(): string {
    return Object.entries(this.config.customId).reduce((prev, curr) => {
      return prev.concat(`${curr[0]}=${curr[1]};`)
    }, '')
  }

  get commandString(): string {
    return Object.values(this.config.customId).join(' ')
  }

  toParsedCommand(): ParsedCommand {
    return ParsedCommand.fromRaw(this.commandString)
  }

  toComponent(): MessageSelectMenu {
    return new MessageSelectMenu()
      .setCustomId(this.customId)
      .setPlaceholder(this.config.placeholder || 'Select')
      .addOptions(...this.config.options)
  }

  static fromId(customId: string): SelectMenu {
    const id = CustomId.fromString<SelectMenuId>(customId)

    // Have a valid menu
    // if (Object.keys(SelectMenuId).includes(opts.type as string)) {
    return new SelectMenu({ customId: id.config } as SelectMenuConfig)
    // }
  }
}
