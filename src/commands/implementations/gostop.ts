import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { RawReply } from '../../messages/replies/raw'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  logSource: 'GoStop',

  services: {
    log: LoggerService,
    playerService: PlayerService,
  },

  async handler({ message }): Promise<boolean> {
    this.services.log.setMessageContext(message, this.options.logSource)

    try {
      const player = this.services.playerService.for(message.info.guildId)

      if (!player) {
        this.services.log.warn(
          'cannot stop player for guild with no active player'
        )
        return false
      }

      this.services.log.debug('stopping player')
      player.stop()

      await message.addReply(
        new RawReply('Playback stopped and queue cleared.')
      )

      return true
    } catch (error) {
      this.services.log.error(error)
      return false
    }
  },

  info: {
    name: CommandNames.Base.stop,
    description: {
      short: 'Stops the current playback.',
    },
    args: [],
    examples: {
      legacy: ['$go stop', '$stop'],
      slashCommand: ['/gostop'],
    },
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
    alias: '$stop',
  },
})
