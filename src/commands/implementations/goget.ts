import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { InfoService } from '../../core/info/info.service'
import { LoggerService } from '../../core/logger/logger.service'

export default new GolemCommand({
  logSource: 'GoGet',

  services: {
    log: LoggerService,
    infoService: InfoService,
  },

  subcommands: {
    nowplaying: {
      name: ['nowplaying', 'np'],
      async handler({ message }) {
        await message.addReply(this.services.infoService.nowPlaying(message))
      },
    },
  },

  async handler(props) {
    const { message } = props
    this.services.log.setMessageContext(message, this.options.logSource)

    try {
      return this.subcommandTree.run(this, props)
    } catch (error) {
      this.services.log.error(error)
      throw error
    }
  },

  info: {
    name: CommandNames.Base.get,
    description: {
      short: 'Retrieve information about the current Golem instance.',
    },
    subcommands: [
      {
        name: 'nowplaying',
        description: {
          short: 'Display the current playing resource.',
        },
        args: [],
      },
    ],
    args: [
      {
        type: 'string',
        name: 'value',
        description: {
          short: 'The property to get information about.',
        },
        required: false,
        choices: [
          { name: 'Run Time', value: 'time' },
          { name: 'Queue Count', value: 'count' },
          { name: 'Now Playing', value: 'nowplaying' },
          { name: 'Track Count', value: 'tcount' },
          { name: 'Playlists', value: 'playlists' },
          { name: 'Info', value: 'all-info' },
        ],
      },
    ],
    examples: {
      legacy: ['$go get', '$go get nowplaying', '$go get count'],
      slashCommand: ['/goget', '/goget nowplaying', '/goget count'],
    },
  },
})
