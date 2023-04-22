export type LocalListing = {
  _id: string
  title: string
  duration: number
  artist: string
  albumName: string
  albumArtist: string
  albumId: string
  album: {
    _id: string | null
    name: string
    artist: string
    path: string
    fileRoot: string
    covers: {
      small: {
        path: string
      }
      med: {
        path: string
      }
      large: {
        path: string
      }
      xlarge: {
        path: string
      }
    }
  }
  listingId: string
  hasDefaultDuration: boolean | null
  path: string
  genres: string[]
  key: string
  moods: string[] | null
  mb: {
    artistId: string
    trackId: string
  }
  addedAt: number
  bpm: number | null
}
