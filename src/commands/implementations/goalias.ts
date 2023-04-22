import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { AliasService } from '../../core/alias/alias.service'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { RawReply } from '../../messages/replies/raw'

export default new GolemCommand({
  logSource: 'GoAlias',

  services: {
    log: LoggerService,
    builder: MessageBuilderService,
    aliasService: AliasService,
  },

  subcommands: {
    create: {
      name: 'create',
      async handler({ message, source }) {
        const createResult = await this.services.aliasService.create(
          message.info.userId,
          message.info.guildId,
          source
        )

        await message.addReply(
          new RawReply(`Created alias: ${createResult.name}.`)
        )
      },
    },
    delete: {
      name: 'delete',
      async handler({ message, source }) {
        const deleteTarget = source.getString('aliasname')

        if (!deleteTarget) {
          throw Errors.BadArgs({
            argName: 'alias-name',
            message: `Missing required "aliasname" parameter. Correct usage is "alias delete <alias-name>"`,
            sourceCmd: '',
            traceId: message.traceId,
          })
        }

        await this.services.aliasService.delete({
          userId: message.info.userId,
          guildId: message.info.guildId,
          aliasName: deleteTarget.trim(),
        })

        await message.addReply(new RawReply(`Deleted alias ${deleteTarget}`))
      },
    },
    list: {
      name: 'list',
      async handler({ message }) {
        const list = await this.services.aliasService.listForGuild(
          message.info.guildId
        )
        await message.addReply(new RawReply('```\n' + list + '\n```'))
      },
    },
  },

  async handler(props) {
    const { message } = props
    this.services.log.setMessageContext(message, 'GoAlias')
    this.services.log.info('executing')

    return this.subcommandTree.run(this, props)
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
