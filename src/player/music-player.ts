// import {
//   AudioPlayerStatus,
//   AudioResource,
//   createAudioPlayer,
//   createAudioResource,
//   CreateVoiceConnectionOptions,
//   entersState,
//   joinVoiceChannel,
//   JoinVoiceChannelOptions,
//   NoSubscriberBehavior,
//   PlayerSubscription,
//   VoiceConnection,
//   VoiceConnectionStatus,
// } from '@discordjs/voice'
// import { Listing } from '../models/listing'
// import { debounce } from '../utils/debounce'
// import { logger } from '../utils/logger'
// import { humanReadableTime } from '../utils/time-utils'
// import { TrackQueue } from './queue'

// /**
//  * TODO
//  * Running this out of a class seems like a bad idea the more i play with
//  * the API. Thinking the best option is to write this as some raw ass js and
//  * just have the play function exported, essentially loading all of the
//  * binding and shit on start.
//  *
//  * - needs to pause when empty channel -> behavior
//  * - needs to gracefully exit on sigint
//  * - needs to leave on timeout (not sure if this is on me to do?)
//  * - need to expose pause
//  *
//  * - need to implement queue (thinking this may have to be implemented
//  *   elsewhere and will simply interact with this Player API or something?)
//  *  - needs skipping
//  *  - needs clearing
//  *
//  */

// const log = logger.child({ src: 'Player' })

// export class Player {
//   private static connection: VoiceConnection
//   private static _player = createAudioPlayer({
//     debug: true,
//     behaviors: {
//       noSubscriber: NoSubscriberBehavior.Stop,
//     },
//   })
//   private static _currentResource: AudioResource
//   private static _initialized = false
//   private static _subscription?: PlayerSubscription
//   private static queue = new TrackQueue()
//   private static debouncedPlayNext = debounce(() => {
//     if (Player._player.state.status === AudioPlayerStatus.Idle) {
//       Player.playNext()
//     }
//   }, 3000)

//   static async start(
//     channelOptions: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
//   ): Promise<void> {
//     log.debug(`Start`)
//     if (!Player._initialized) {
//       Player.setup()
//       Player._initialized = true
//     }

//     if (!Player.connection) {
//       log.debug('No Connection, creating new')
//       Player.connection = Player.connect(channelOptions)
//       log.debug('Connection Created')

//       try {
//         await entersState(
//           Player.connection,
//           VoiceConnectionStatus.Ready,
//           20_000
//         )
//       } catch {
//         if (Player.connection.state.status !== VoiceConnectionStatus.Destroyed)
//           Player.connection.destroy()
//       }
//     }

//     if (!Player._subscription) {
//       log.debug('Subscribing to connection')
//       Player._subscription = Player.connection.subscribe(Player._player)
//     }
//   }

//   static enqueue(listing: Listing): void {
//     log.debug(`Enqueuing ${listing.name}`)
//     Player.queue.add(listing)
//     Player.play(listing)
//   }

//   static enqueueMany(listings: Listing[]): void {
//     const first = listings.shift()

//     if (first) {
//       Player.enqueue(first)
//       Player.queue.addMany(listings)
//     }
//   }

//   // TODO also broken...
//   static pause(): void {
//     log.info('pausing')
//     Player._player.pause()
//   }

//   static skip(): void {
//     log.info('Skipping')

//     const next = Player.queue.pop()
//     if (next) {
//       Player.play(next)
//     } else {
//       Player.stop()
//     }
//   }

//   static clear(): void {
//     log.info('clearing queue')
//     Player.stop()

//     Player.queue.clear()
//   }

//   static unpause(): void {
//     log.info('resuming playback')
//     Player._player.unpause()
//   }

//   static peek(depth = 5): Listing[] {
//     log.info('Peeking Deep')
//     return this.queue.peekDeep(depth)
//   }

//   static shuffle(): void {
//     log.info('Shuffling')
//     this.queue.shuffle()
//   }

//   static get currentTrackRemaining(): number {
//     return (
//       (Player.queue.peek()?.duration || 0) -
//       Player._currentResource.playbackDuration / 1000
//     )
//   }

//   static get stats(): { count: number; time: number; hTime: string } {
//     return {
//       count: Player.queue.queuedTrackCount,
//       time: Player.queue.runTime + Player.currentTrackRemaining,
//       hTime: humanReadableTime(
//         Player.queue.runTime + Player.currentTrackRemaining
//       ),
//     }
//   }

//   static get nowPlaying(): string {
//     return Player.queue.peek()?.name || 'No Track Playing'
//   }

//   static get isPlaying(): boolean {
//     return !(
//       !Player._currentResource ||
//       (Player._currentResource && Player._currentResource.ended)
//     )
//   }

//   private static play(listing: Listing): void {
//     log.debug(`Playing ${listing.name}`)
//     log.debug(
//       `Current Player State: playing=${
//         Player.isPlaying
//       }; connection=${!!Player.connection}; resource=${!!Player._currentResource}; ended=${
//         Player._currentResource?.ended
//       }`
//     )

//     if (!Player.isPlaying) {
//       log.debug('Player not playing - adding resource to play')
//       const resource = createAudioResource(listing.path, {
//         silencePaddingFrames: 0,
//       })
//       Player._currentResource = resource
//       Player._player.play(Player._currentResource)
//       log.debug(`Resource Created`)
//       Player._player.play(resource) // TODO wtf was this
//     }
//   }

//   // The peek pop peek can probs be pulled to a
//   // function in teh queue?
//   private static playNext(): void {
//     log.debug('playNext Called')
//     const nextTrack = Player.queue.peek()

//     if (Player._currentResource?.ended && nextTrack) {
//       Player.queue.pop()
//       log.info(`Playing Next track ${nextTrack.name}`)
//       const next = Player.queue.peek()
//       if (next) {
//         Player.play(next)
//       }
//     } else if (Player._currentResource?.ended && !nextTrack) {
//       log.debug('playNext Resource ended, no next track')
//       Player.queue.pop()
//       Player.stop()
//     }
//   }

//   private static stop(): void {
//     Player._player.stop()
//   }

//   private static disconnect(): void {
//     log.debug('Player:disconnect')
//     Player.connection.destroy()
//     Player._initialized = false
//     return
//   }

//   private static connect(
//     channelOptions: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
//   ): VoiceConnection {
//     log.debug(
//       `Connection With channelId: ${channelOptions.channelId} guildId: ${channelOptions.guildId}`
//     )
//     return joinVoiceChannel({
//       channelId: channelOptions.channelId,
//       guildId: channelOptions.guildId,
//       adapterCreator: channelOptions.adapterCreator,
//     })
//   }

//   private static setup(): void {
//     process.on('SIGINT', () => {
//       Player.disconnect()
//       return
//     })

//     Player._player.on('error', (error) => {
//       log.error(`Audio Player Error: ${error}`)
//     })

//     Player._player.on('debug', (msg) => {
//       log.debug(`${msg}`)
//     })

//     Player._player.on('stateChange', (oldState, newState) => {
//       if (
//         newState.status === AudioPlayerStatus.Idle &&
//         oldState.status !== AudioPlayerStatus.Idle
//       ) {
//         Player.playNext()
//       }
//     })

//     Player._player.on(AudioPlayerStatus.Buffering, () => {
//       log.debug('Entered Buffering')
//     })

//     // Player._player.on(AudioPlayerStatus.Idle, () => {
//     //   log.debug('Entered Idle')
//     //   Player.debouncedPlayNext()
//     // })

//     Player._player.on(AudioPlayerStatus.Paused, () => {
//       log.debug('Entered Paused')
//     })

//     Player._player.on(AudioPlayerStatus.Playing, () => {
//       log.debug('Entered Playing')
//     })

//     Player._player.on(AudioPlayerStatus.AutoPaused, () => {
//       log.debug('Entered AutoPaused')
//     })
//   }
// }
