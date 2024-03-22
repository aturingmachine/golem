import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { NowPlayingReply } from '../../messages/replies/now-playing'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  logSource: 'GoShuffle',

  services: {
    log: LoggerService,
    playerService: PlayerService,
  },

  async handler({ message }) {
    this.services.log.setMessageContext(message, this.options.logSource)

    const player = this.services.playerService.shuffle(message.info)

    if (player.nowPlaying) {
      try {
        await message.addReply(
          NowPlayingReply.fromListing(message, player.nowPlaying, player)
        )
      } catch (error) {
        console.log(error)
      }
    }
  },

  info: {
    name: CommandNames.Base.shuffle,
    description: {
      short:
        "Shuffle the current queue maintaining the playnext queue's position.",
    },
    args: [],
    examples: {
      legacy: ['$go shuffle'],
      slashCommand: ['/goshuffle'],
    },
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
  },
})
