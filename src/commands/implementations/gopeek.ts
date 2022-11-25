import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { QueueReply } from '../../messages/replies/queue'
import { RawReply } from '../../messages/replies/raw'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  services: {
    playerService: PlayerService,
    log: LoggerService,
  },
  logSource: 'go-peek',
  async handler({ message }) {
    this.services.log.setMessageContext(message, 'GoPeek')

    const player = this.services.playerService.for(message.info.guildId)

    console.log('Got Player:', player, player?.trackCount)

    if (!player) {
      await message.addReply(new RawReply('Not in a valid voice channel.'))
      this.services.log.info(`no channel to join, exiting early`)
      return false
    }

    // TODO support dynamic values
    const peekedResources = player.peek(20)

    this.services.log.debug(`peek returned ${peekedResources.length} tracks`)

    const peek = new QueueReply(
      peekedResources.map((resources) => resources.track)
    )

    await message.addReply(peek)

    return true
  },
  info: {
    name: CommandNames.Base.peek,
    description: {
      long: 'See the next tracks in the queue.',
      short: 'See the next tracks in the queue.',
    },
    args: [],
    examples: {
      legacy: ['$go peek'],
      slashCommand: ['/gopeek'],
    },
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
  },
})
