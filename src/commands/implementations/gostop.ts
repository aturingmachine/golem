import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  logSource: 'GoStop',

  services: {
    log: LoggerService,
    playerService: PlayerService,
  },

  async handler({ message }) {
    this.services.log.setMessageContext(message, this.options.logSource)

    const player = this.services.playerService.for(message.info.guildId)

    if (!player) {
      this.services.log.warn(
        'cannot stop player for guild with no active player'
      )

      throw Errors.NoPlayer({
        message: `cannot stop player for server with no active player. Server: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`,
        sourceCmd: 'stop',
        traceId: message.traceId,
      })
    }

    this.services.log.debug('stopping player')
    player.stop()

    await message.addReply('Playback stopped and queue cleared.')
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
