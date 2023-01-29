import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { AliasService } from '../../core/alias/alias.service'
import { LoggerService } from '../../core/logger/logger.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { RawReply } from '../../messages/replies/raw'

export default new GolemCommand({
  logSource: 'GoAlias',

  services: {
    log: LoggerService,
    builder: MessageBuilderService,
    aliasService: AliasService,
  },

  async handler({ message, source }): Promise<boolean> {
    this.services.log.setMessageContext(message, 'GoAlias')
    this.services.log.info('executing')

    const subCommand = source.subCommand
    this.services.log.debug(`sourced=${source.toDebug()}`)

    switch (subCommand) {
      case 'create':
        const result = await this.services.aliasService.create(
          message.info.userId,
          message.info.guildId,
          source
        )

        if (typeof result !== 'number') {
          await message.addReply(new RawReply(`Created alias: ${result.name}.`))
          return true
        }

        await message.addReply(
          new RawReply(
            result === 1
              ? 'Unable to create alias due to an error.'
              : 'Alias with the same name already exists.'
          )
        )

        return false
      case 'delete':
        return false
        break
      case 'list':
        const list = await this.services.aliasService.listForGuild(
          message.info.guildId
        )
        await message.addReply(new RawReply('```\n' + list + '\n```'))

        return true
      default:
        return false
    }
  },

  info: {
    name: CommandNames.Base.alias,
    description: {
      short: 'Interact with the aliases registered for this server.',
    },
    subcommands: [
      {
        name: 'create',
        description: {
          long: 'Create a new alias using GolemAlias format. [name of alias] => [full Golem command]. The alias will be made by removing white space within the "name of alias" section.',
          short: 'Create a new alias.',
        },
        args: [
          {
            type: 'string',
            name: 'aliascommand',
            description: {
              long: 'A GolemAlias string. Strings are formatted as "aliasName => $command". Everything to the left of the => delimiter will be stripped of whitespace to make the new alias name. When Golem recieves an alias it will execute the right side of the delimiter **as is**, and interperet it as if it is a new command.',
              short: 'A valid GolemAlias string. "aliasName => $go command"',
            },
            required: true,
          },
        ],
      },
      {
        name: 'delete',
        description: {
          long: 'Delete an alias by name. Requires the target alias to be created by the same user requesting the deletion or the requesting user to have elevated privileges.',
          short: 'Delete an alias by name.',
        },
        args: [
          {
            type: 'string',
            name: 'aliasname',
            description: {
              long: 'The name of the alias to delete. The name is equivalent to what one runs for the command without the prefixed $.',
              short: 'The name of the alias to delete.',
            },
            required: true,
          },
        ],
      },
      {
        name: 'list',
        description: {
          short: 'List aliases registered to this server.',
        },
        args: [],
      },
    ],
    args: [],
    examples: {
      legacy: [
        '$go alias create hype => $go play darude sandstorm',
        '$go alias list',
        '$go alias delete hype',
      ],
      slashCommand: [
        '/goalias create hype => $go play darude sandstorm',
        '/goalias list',
        '/goalias delete hype',
      ],
    },
  },
})
