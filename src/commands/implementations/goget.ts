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

  async handler({ message, source }): Promise<boolean> {
    this.services.log.setMessageContext(message, this.options.logSource)

    try {
      switch (source.subCommand) {
        case 'nowplaying':
        case 'np':
          await message.addReply(this.services.infoService.nowPlaying(message))
      }

      return true
    } catch (error) {
      this.services.log.error(error)
      return false
    }
  },

  info: {
    name: CommandNames.Base.get,
    description: {
      short: 'Retrieve information about the current Golem instance.',
    },
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
