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

  subcommands: {
    create: {
      name: 'create',
      async handler({ message, source }) {
        const createResult = await this.services.aliasService.create(
          message.info.userId,
          message.info.guildId,
          source
        )

        if (typeof createResult !== 'number') {
          await message.addReply(
            new RawReply(`Created alias: ${createResult.name}.`)
          )
          return true
        }

        await message.addReply(
          new RawReply(
            createResult === 1
              ? 'Unable to create alias due to an error.'
              : 'Alias with the same name already exists.'
          )
        )

        return false
      },
    },
    delete: {
      name: 'delete',
      async handler({ message, source }) {
        const deleteTarget = source.getString('aliasname')

        if (!deleteTarget) {
          await message.addReply(
            `Missing required "aliasname" parameter. Correct usage is "alias delete <alias-name>"`
          )
          return false
        }

        const deleteResult = await this.services.aliasService.delete({
          userId: message.info.userId,
          guildId: message.info.guildId,
          aliasName: deleteTarget.trim(),
        })

        if (deleteResult === 0) {
          await message.addReply(new RawReply(`Deleted alias ${deleteTarget}`))
          return true
        }

        // Error deleting alias.
        if (deleteResult === 4) {
          await message.addReply(new RawReply(`Error deleting alias.`))
        }

        // Not allowed to delete.
        if (deleteResult === 3) {
          await message.addReply(
            new RawReply(
              `Missing Required permissions to delete an alias on this server.`
            )
          )
        }

        // Not found
        if (deleteResult === 2) {
          await message.addReply(
            new RawReply(
              `No alias found on this server named "${deleteTarget}"`
            )
          )
        }

        // Not allowed to delete THIS alias.
        if (deleteResult === 1) {
          await message.addReply(
            new RawReply(
              `Missing required permissions to delete alias "${deleteTarget}"`
            )
          )
        }

        return false
      },
    },
    list: {
      name: 'list',
      async handler({ message }) {
        const list = await this.services.aliasService.listForGuild(
          message.info.guildId
        )
        await message.addReply(new RawReply('```\n' + list + '\n```'))

        return true
      },
    },
  },

  async handler(props): Promise<boolean> {
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
