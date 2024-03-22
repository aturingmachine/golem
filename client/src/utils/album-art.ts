import type { Album } from '@/models/album';
import { TrackType, type MusicPlayerJSON, type ShortTrack } from '@/models/players';

export function createArtUrl(album: Album | string, size: 'large' | 'med' | 'small' | 'xl' = 'med'): string {
  return window.location.protocol + '//' +  __API_URL__  + '/album-art/' + 
    encodeURIComponent(
      typeof album === 'string' 
        ? album  + '_' + size
        : album.fileRoot + '_' + size
    )
}

export function createArt(type: TrackType, listing: ShortTrack | Album | string): string {
  if (type === TrackType.Local && (typeof listing === 'string' || '_id' in listing)) {
    return createArtUrl(listing)
  } else {
    return `https://i.ytimg.com/vi/${listing.id}/maxresdefault.jpg`
  }
}
