declare module 'plex-api' {
  interface PlexApiOptions {
    hostname?: string
    port?: number
    https?: boolean
    username?: string
    password?: string
    token?: string
    timeout?: string
    options?: {
      identifier?: string
      product?: string
      version?: string
      deviceName?: string
    }
  }

  export type PlaylistMetadata = {
    ratingKey: string
    key: string
    guid: string
    type: string
    title: string
    titleSort: string
    summary: string
    smart: true
    playlistType: string
    composite: string
    icon: string
    viewCount: number
    lastViewedAt: number
    duration: number
    leafCount: number
    addedAt: number
    updatedAt: number
  }

  export type LibraryItem = {
    ratingKey: string
    key: string
    parentRatingKey: string
    grandparentRatingKey: string
    guid: string
    parentGuid: string
    grandparentGuid: string
    parentStudio: string
    type: string
    title: string
    grandparentKey: string
    parentKey: string
    librarySectionTitle: string
    librarySectionID: number
    librarySectionKey: string
    grandparentTitle: string
    parentTitle: string
    summary: string
    index: number
    parentIndex: number
    ratingCount: number
    userRating: number
    viewCount: number
    lastViewedAt: number
    lastRatedAt: number
    parentYear: number
    thumb: string
    art: string
    parentThumb: string
    grandparentThumb: string
    grandparentArt: string
    duration: number
    addedAt: number
    updatedAt: number
    musicAnalysisVersion: string
    Media: [
      {
        id: number
        duration: number
        bitrate: number
        audioChannels: number
        audioCodec: string
        container: string
        Part: [
          {
            id: number
            key: string
            duration: number
            file: string
            size: number
            container: string
            hasThumbnail: string
          }
        ]
      }
    ]
  }

  export type MediaContainer<T> = {
    size?: number
    composite?: string
    duration?: number
    leafCount?: number
    playlistType?: string
    ratingKey?: string
    smart?: true
    title?: string
    Metadata?: T[]
  }

  type PlexResponse<T> = {
    MediaContainer: MediaContainer<T>
  }

  export default class PlexAPI {
    constructor(options: PlexApiOptions)

    query<T>(uri: string): Promise<PlexResponse<T>>
  }
}
