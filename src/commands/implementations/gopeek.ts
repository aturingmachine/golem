import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { QueueReply } from '../../messages/replies/queue'
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

    if (!player) {
      this.services.log.info(`no channel to join, exiting early`)

      throw Errors.NoPlayer({
        message: 'Cannot peek queue, no active player in server.',
        sourceCmd: 'pause',
        traceId: message.traceId,
      })
    }

    // TODO support dynamic values
    const peekedResources = player.peek(20)

    this.services.log.debug(`peek returned ${peekedResources.length} tracks`)

    const peek = new QueueReply(
      peekedResources.map((resources) => resources.track),
      player.trackCount
    )

    await message.addReply(peek)
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
