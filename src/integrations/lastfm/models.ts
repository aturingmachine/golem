export interface SimilarArtistMatch {
  name: string
  mbid: string
}

export interface SimilarTrackMatch {
  name: string
  mbid: string
  artist: SimilarArtistMatch
}

export interface SimilarArtistMatchRecord {
  similarartists: { artist: SimilarArtistMatch[] }
}

export interface SimilarTrackMatchRecord {
  similartracks: { track: SimilarTrackMatch[] }
}
