import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { NoPlayerError } from '../../errors/no-player-error'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { RawReply } from '../../messages/replies/raw'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  services: {
    log: LoggerService,
    builder: MessageBuilderService,
    playerService: PlayerService,
  },
  logSource: 'go-play',
  async handler({ message }): Promise<boolean> {
    this.services.log.setMessageContext(message, 'GoPause')

    this.services.log.info('executing')

    const player = this.services.playerService.for(message.info.guildId)

    if (!player) {
      throw new NoPlayerError({
        message: 'Cannot pause, no active player in server.',
        sourceCmd: 'pause',
      })
    }

    player.pause()

    await message._replies.add(new RawReply('Pausing Playback.'))

    return true
  },
  info: {
    name: CommandNames.Base.pause,
    description: {
      long: 'Pause the current playback.',
      short: 'Pause the current playback.',
    },
    args: [],
    examples: {
      legacy: ['$go pause'],
      slashCommand: ['/gopause'],
    },
    alias: '$pause',
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
  },
})
