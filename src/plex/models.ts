export type Playlist = {
  name: string
  count: number
  listings: { id: string; name: string }[]
}

export type PlaylistRecord = {
  name: string
  count: number
  filePaths: string[]
}

/**
 * Media.Part.file is the thing we give a fuck about
 */
export type PlaylistTrack = {
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
  librarySectionID: 1
  librarySectionKey: string
  grandparentTitle: string
  parentTitle: string
  originalTitle: string
  summary: string
  index: number
  parentIndex: number
  ratingCount: number
  viewCount: number
  lastViewedAt: number
  parentYear: number
  thumb: string
  art: string
  parentThumb: string
  grandparentThumb: string
  grandparentArt: string
  duration: number
  addedAt: number
  updatedAt: number
  Media: [
    {
      id: number
      duration: number
      audioChannels: number
      audioCodec: string
      container: string
      optimizedForStreaming: number
      audioProfile: string
      has64bitOffsets: boolean
      Part: [
        {
          id: number
          key: string
          duration: number
          file: string
          size: number
          audioProfile: string
          container: string
          has64bitOffsets: boolean
          hasThumbnail: string
          optimizedForStreaming: boolean
        }
      ]
    }
  ]
}

export type PlaylistDetailsContainer = {
  MediaContainer: {
    size: number
    composite: string
    duration: number
    leafCount: number
    playlistType: string
    ratingKey: string
    smart: boolean
    title: string
    Metadata: PlaylistTrack[]
  }
}

export type PlaylistMetaInfo = {
  ratingKey: string
  key: string
  guid: string
  type: string
  title: string
  titleSort: string
  summary: string
  smart: boolean
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

export type PlaylistsContainer = {
  MediaContainer: {
    size: number
    Metadata: PlaylistMetaInfo[]
  }
}
