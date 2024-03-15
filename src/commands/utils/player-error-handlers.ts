import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { GolemMessage } from '../../messages/golem-message'
import { MusicPlayer } from '../../music/player/player'

type ValidPlayerParams = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // command: GolemCommand<any>
  logger: LoggerService
  message: GolemMessage
  sourceCmd: string
}

export function isValidPlayer(
  player:
    | MusicPlayer
    | 'ERR_ALREADY_ACTIVE'
    | 'ERR_NO_VOICE_CHANNEL'
    | undefined,
  params: ValidPlayerParams
): player is MusicPlayer {
  const { message, logger, sourceCmd } = params

  const guildName = message.info.guild?.name || 'No Valid Server.'
  const channelName =
    message.info.voiceChannel?.name || 'No Active Voice Channel.'

  if (!player) {
    logger.warn(
      `unable to create player for guild: ${guildName} channel: ${channelName}`
    )

    throw Errors.NoPlayer({
      message: `Unable to create player for guild: ${guildName} channel: ${channelName}`,
      sourceCmd: sourceCmd,
      traceId: message.traceId,
      guildName,
      voiceChannel: channelName,
    })
  }

  if (player === 'ERR_NO_VOICE_CHANNEL') {
    logger.warn(
      `attempted to use a player while not in a valid voice channel; guild: ${guildName} channel: ${channelName}`
    )

    throw Errors.NoPlayer({
      message: `This command requires the user be in a valid Voice Channel upon invocation.`,
      sourceCmd: sourceCmd,
      traceId: message.traceId,
    })
  }

  if (player === 'ERR_ALREADY_ACTIVE') {
    logger.warn(
      `attempted to interact with a player from another voice channel while bot was already active; guild: ${guildName} channel: ${channelName}`
    )

    throw Errors.ActivePlayerChannelMismatch({
      message: `Attempted action that requires matching Voice Channel with bot, but found mismsatched Voice Channels.`,
      sourceCmd: sourceCmd,
      traceId: message.traceId,
    })
  }

  return true
}
