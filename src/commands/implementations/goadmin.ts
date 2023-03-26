import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { AdminService } from '../../core/admin/admin.service'
import { LoggerService } from '../../core/logger/logger.service'
import { PreformattedReply } from '../../messages/replies/preformatted'
import { RawReply } from '../../messages/replies/raw'

export default new GolemCommand({
  logSource: 'GoAdmin',

  services: {
    admin: AdminService,
    log: LoggerService,
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
    ],
    args: [],
    examples: {
      legacy: ['$go admin librefresh'],
      slashCommand: ['/goadmin librefresh'],
    },
  },
})
