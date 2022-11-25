import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { RawReply } from '../../messages/replies/raw'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  logSource: 'GoShuffle',

  services: {
    log: LoggerService,
    playerService: PlayerService,
    builder: MessageBuilderService,
  },

  async handler({ message }): Promise<boolean> {
    this.services.log.setMessageContext(message, this.options.logSource)

    try {
      const player = this.services.playerService.for(message.info.guildId)

      if (!player) {
        this.services.log.warn(`cannot run shuffle on guild with no player`)

        await message.addReply(
          new RawReply('No active player, cannot shuffle.')
        )

        return false
      }

      player.shuffle()

      if (player.nowPlaying) {
        await message.addReply(
          this.services.builder.nowPlaying(message, player.nowPlaying)
        )
      } else {
        //This case should be impossible but :shrug:
        await message.addReply(new RawReply('Queue shuffled!'))
      }

      return true
    } catch (error) {
      this.services.log.error(error)
      return false
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
