export const AudioPlayerStatus = {
  /**
   * When the player has paused itself. Only possible with the "pause" no subscriber behavior.
   */
  AutoPaused: "autopaused",
  /**
   * When the player is waiting for an audio resource to become readable before transitioning to Playing.
   */
  Buffering: "buffering",
  /**
   * When there is currently no resource for the player to be playing.
   */
  Idle: "idle",
  /**
   * When the player has been manually paused.
   */
  Paused: "paused",
  /**
   * When the player is actively playing an audio resource.
   */
  Playing: "playing"
} as const

export type AudioPlayerStatus = Enumerable<typeof AudioPlayerStatus>

export enum TrackType {
  Local = 'Local',
  Youtube = 'Youtube',
}

export type ShortTrack = {
  type: string
  id: string
  title: string
  artist: string
  duration: string
  album: string
  albumId: string
}

export type MusicPlayerJSON = {
  guild: {
    id: string
    name: string
  }

  channel: {
    id: string
    name: string
  }

  nowPlaying: {
    listing: {
      id: string | undefined
      type: TrackType
      duration: number | undefined
      playbackDuration: number | undefined
      title: string | undefined
      artist: string | undefined
    }
  }

  queue: ShortTrack[]

  status: AudioPlayerStatus
}
