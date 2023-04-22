import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { AdminService } from '../../core/admin/admin.service'
import { GuildConfig } from '../../core/guild-config/guild-config.model'
import { GuildConfigService } from '../../core/guild-config/guild-config.service'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { PreformattedReply } from '../../messages/replies/preformatted'
import { RawReply } from '../../messages/replies/raw'
import { Replies } from '../../messages/replies/replies'
import { DiscordMarkdown } from '../../utils/discord-markdown-builder'

export default new GolemCommand({
  logSource: 'GoAdmin',

  services: {
    admin: AdminService,
    log: LoggerService,
    guildConfigService: GuildConfigService,
  },

  subcommands: {
    bugs: {
      name: 'bugs',
      // TODO
      async handler({ message }) {
        await message.addReply(new RawReply('Not yet implemented.'))
      },
    },
    librefresh: {
      name: 'librefresh',
      async handler({ message }) {
        const result = await this.services.admin.refreshLibraries(message)

        const msg = Object.entries(result).reduce((prev, curr) => {
          return prev.concat(`\n${curr[0]}: ${curr[1]} new listings.`)
        }, 'Refresh Results:')

        await message.addReply(new PreformattedReply(msg))
      },
    },
    config: {
      name: 'config',
      async handler({ message, source }) {
        const key = source.getString('key')
        const value = source.getString('value')

        if (!key) {
          throw Errors.BadArgs({
            argName: 'key',
            message:
              'Missing required paramater "key". Correct usage is "admin <key> <value>"',
            sourceCmd: 'admin.config',
            traceId: message.traceId,
          })
        }

        if (!value) {
          throw Errors.BadArgs({
            argName: 'value',
            message:
              'Missing required paramater "value". Correct usage is "admin <key> <value>"',
            sourceCmd: 'admin.config',
            traceId: message.traceId,
          })
        }

        const castedKey = key as keyof Omit<GuildConfig, '_id' | 'guildId'>
        const validKeys: (keyof Omit<GuildConfig, '_id' | 'guildId'>)[] = [
          'defaultChannelId',
          'subscribedToUpdates',
        ]

        if (!validKeys.includes(castedKey)) {
          throw Errors.BadArgs({
            argName: 'key',
            message: `Provided key "${key}" is not a valid configuration option. Valid options include "${validKeys.join(
              ', '
            )}"`,
            sourceCmd: 'admin.config',
            traceId: message.traceId,
          })
        }

        let config = await this.services.guildConfigService.getOrCreateDefault(
          message.info.guildId
        )

        config = GuildConfig.update(config, castedKey, value)

        this.services.log.info(
          `attempting to update config for ${message.info.guildId}`
        )
        await this.services.guildConfigService.update(config)

        await message.addReply(
          Replies.Raw(
            DiscordMarkdown.start()
              .raw('Guild Config Setting ')
              .code(key)
              .raw(' has been set to ')
              .code(
                GuildConfig.castValue(castedKey, value)?.toString() ||
                  'undefined'
              )
              .toString()
          )
        )
      },
    },
  },

  async handler(props) {
    const { message } = props
    this.services.log.setMessageContext(message, this.options.logSource)

    return this.subcommandTree.run(this, props)
  },

  info: {
    name: CommandNames.Base.admin,
    description: {
      short: 'Perform Administrative tasks.',
    },
    subcommands: [
      {
        name: 'librefresh',
        description: {
          short: 'Refresh all libraries, reading in new listings.',
        },
        args: [],
      },
      {
        name: 'bugs',
        description: {
          short: 'View last 5 bug reports.',
        },
        args: [],
      },
      {
        name: 'config',
        description: {
          short: 'Update config settings for this server.',
        },
        args: [
          {
            name: 'key',
            required: true,
            type: 'string',
            description: {
              short: 'The option to update.',
            },
          },
          {
            name: 'value',
            required: true,
            type: 'string',
            description: {
              short: 'The value to set it to.',
            },
          },
        ],
      },
    ],
    args: [],
    examples: {
      legacy: ['$go admin librefresh'],
      slashCommand: ['/goadmin librefresh'],
    },
  },
})
