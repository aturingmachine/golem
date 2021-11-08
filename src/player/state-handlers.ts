import { AudioPlayerState, AudioPlayerStatus } from '@discordjs/voice'
import { Golem } from '../golem'
import { GolemEvent } from '../golem/event-emitter'
import { MusicPlayer } from './music-player'

function isNotActive(status: AudioPlayerStatus): boolean {
  return ![AudioPlayerStatus.Buffering, AudioPlayerStatus.Playing].includes(
    status
  )
}

export async function audioPlayerStateHandler(
  this: MusicPlayer,
  oldState: AudioPlayerState,
  newState: AudioPlayerState
): Promise<void> {
  switch (newState.status) {
    case AudioPlayerStatus.AutoPaused:
      // start timer
      break
    case AudioPlayerStatus.Buffering:
      break
    case AudioPlayerStatus.Idle:
      Golem.setPresenceIdle()
      // start timer

      if (
        oldState.status !== AudioPlayerStatus.Idle &&
        !this.isDisconnected &&
        !this.isDestroyed
      ) {
        // process queue
      }
      break
    case AudioPlayerStatus.Paused:
      // start timer
      break
    case AudioPlayerStatus.Playing:
      if (isNotActive(oldState.status)) {
        // clear timer

        // if idle trigger queue event
        if (oldState.status === AudioPlayerStatus.Idle) {
          //
          Golem.events.trigger(
            GolemEvent.Queue,
            this.voiceConnection.joinConfig.guildId
          )
        }
      }
      break
  }
}

/**
 * Saving in case the new one breaks
 */
// MusicPlayer.playerStateHandler
// if (newState.status === AudioPlayerStatus.Idle) {
//   Golem.setPresenceIdle()
// }

// if (
//   newState.status === AudioPlayerStatus.Idle &&
//   oldState.status !== AudioPlayerStatus.Idle &&
//   !this.isDisconnected &&
//   !this.isDestroyed
// ) {
//   this.log.verbose(`entering Idle state - processing queue`)
//   // start timer
//   this.startTimer()
//   void (await this.processQueue())
// } else if (newState.status === AudioPlayerStatus.Playing) {
//   if (
//     [
//       AudioPlayerStatus.Idle,
//       AudioPlayerStatus.Paused,
//       AudioPlayerStatus.AutoPaused,
//     ].includes(oldState.status)
//   ) {
//     this.log.debug(`player ${this.channelId} entering Playing status`)

//     if (oldState.status === AudioPlayerStatus.Idle) {
//       Golem.events.trigger(
//         GolemEvent.Queue,
//         this.voiceConnection.joinConfig.guildId
//       )
//     }

//     // clear
//     this.clearTimer()
//   }
// } else if (
//   [
//     AudioPlayerStatus.Idle,
//     AudioPlayerStatus.Paused,
//     AudioPlayerStatus.AutoPaused,
//   ].includes(newState.status)
// ) {
//   // start timer
//   this.startTimer()
// } else if (newState.status === AudioPlayerStatus.Buffering) {
//   this.log.debug(`player ${this.channelId} entering Buffering status`)

//   // clear the timer when we start buffering just for safety?
//   this.clearTimer()
// }
