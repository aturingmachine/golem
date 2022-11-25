import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { AdminService } from '../../core/admin/admin.service'
import { PreformattedReply } from '../../messages/replies/preformatted'
import { RawReply } from '../../messages/replies/raw'

export default new GolemCommand({
  logSource: 'GoAdmin',

  services: {
    admin: AdminService,
  },

  async handler({ message, source }): Promise<boolean> {
    switch (source.subCommand) {
      case 'librefresh':
        const result = await this.services.admin.refreshLibraries(message)

        if (typeof result === 'object') {
          const msg = Object.entries(result).reduce((prev, curr) => {
            return prev.concat(`\n${curr[0]}: ${curr[1]} new listings.`)
          }, 'Refresh Results:')

          await message.addReply(new PreformattedReply(msg))

          return true
        }

        switch (result) {
          case 1:
            await message.addReply(
              new RawReply(`Library Refresh requires Administrator privileges.`)
            )
            break
          case 2:
            await message.addReply(
              new RawReply(
                `Cannot refresh Libraries - LocalMusic module is not loaded.`
              )
            )
            break
        }

        return false

      case 'bugs':
        await message.addReply(new RawReply('Not yet implemented.'))
        return false
      default:
        await message.addReply(
          new RawReply('Admin command requires a sub-command')
        )
        return false
    }
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
      // {
      //   name: 'bugs',
      //   description: {
      //     short: 'View last 5 bug reports.',
      //   },
      //   args: [],
      // },
    ],
    args: [],
    examples: {
      legacy: ['$go admin librefresh'],
      slashCommand: ['/goadmin librefresh'],
    },
  },
})
