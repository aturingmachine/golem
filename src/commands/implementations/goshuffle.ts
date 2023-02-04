import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemError } from '../../errors/golem-error'
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

    const player = this.services.playerService.shuffle(message.info.guildId)

    if (player.nowPlaying) {
      await message.addReply(
        this.services.builder.nowPlaying(message, player.nowPlaying)
      )
    } else {
      //This case should be impossible but :shrug:
      await message.addReply(new RawReply('Queue shuffled!'))
    }

    return true
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
