import { Golem } from '../golem'
import { formatForLog } from '../utils/debug-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { EventHandler } from '.'

const log = GolemLogger.child({ src: LogSources.VoiceStateUpdate })

const interactionCreate: EventHandler<'voiceStateUpdate'> = {
  on: 'voiceStateUpdate',
  async execute(oldState, newState) {
    log.silly(`Received voice state update ${newState.guild.id}`)
    const player = Golem.getPlayer(newState.guild.id)
    log.silly(
      `${formatForLog({
        channel: oldState.channel?.name,
        membersCount: oldState.channel?.members.size,
      })}`
    )

    if (
      player &&
      newState.channelId === player.channelId &&
      (newState.channel?.members?.size || 0) > 1 &&
      player.isPlaying
    ) {
      log.debug(`member joined while playing - clearing timer`)
      player.clearTimer()
    }

    if (
      player &&
      oldState.channelId === player.channelId &&
      oldState.channel?.members.size === 1
    ) {
      log.debug(`no members left in channel with bot - starting auto-dc timer`)
      player.startTimer()
    }
  },
}

export default interactionCreate
