import { promisify } from 'util'
import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import { TrackQueue } from './queue'

const wait = promisify(setTimeout)

export class MusicPlayer {
  public queueLock = false
  public readyLock = false

  public readonly voiceConnection: VoiceConnection
  public readonly audioPlayer: AudioPlayer
  private readonly queue: TrackQueue

  public constructor(voiceConnection: VoiceConnection) {
    this.voiceConnection = voiceConnection
    this.audioPlayer = createAudioPlayer()
    this.queue = new TrackQueue()

    this.voiceConnection.on('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          try {
            await entersState(
              this.voiceConnection,
              VoiceConnectionStatus.Connecting,
              5_000
            )
            // Probably moved voice channel
          } catch {
            this.voiceConnection.destroy()
            // Probably removed from voice channel
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          /*
						The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000)
          this.voiceConnection.rejoin()
        } else {
          /*
						The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
          this.voiceConnection.destroy()
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        /*
					Once destroyed, stop the subscription
				*/
        this.stop()
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        /*
					In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
					before destroying the voice connection. This stops the voice connection permanently existing in one of these
					states.
				*/
        this.readyLock = true
        try {
          await entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Ready,
            20_000
          )
        } catch {
          if (
            this.voiceConnection.state.status !==
            VoiceConnectionStatus.Destroyed
          )
            this.voiceConnection.destroy()
        } finally {
          this.readyLock = false
        }
      }
    })

    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.
        ;(oldState.resource as AudioResource<Track>).metadata.onFinish()
        void this.processQueue()
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // If the Playing state has been entered, then a new track has started playback.
        ;(newState.resource as AudioResource<Track>).metadata.onStart()
      }
    })
  }
}
