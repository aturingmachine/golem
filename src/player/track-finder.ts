import Fuse from 'fuse.js'
import { Config } from '../utils/config'
import { getAllFiles } from '../utils/filesystem'

interface Listing {
  artist: string
  album: string
  track: string
  path: string
}

export class TrackFinder {
  private static listings: Listing[] = []
  private static _search: Fuse<Listing>

  static load3(): void {
    const paths = getAllFiles(Config.libraryPath, [])
    TrackFinder.listings = paths.map((trackPath) => {
      const split = trackPath.replace(Config.libraryPath, '').split('/')
      const artist = split[1]
      const album = split[2]
      const track = split[3]

      return {
        artist,
        album,
        track,
        path: trackPath,
      }
    })

    TrackFinder._search = new Fuse<Listing>(TrackFinder.listings, {
      keys: [
        {
          name: 'artist',
          weight: 0.6,
        },
        {
          name: 'album',
          weight: 0.3,
        },
        {
          name: 'track',
          weight: 1.5,
        },
      ],
      includeScore: true,
      ignoreLocation: true,
    })
  }

  static search(query: string): Listing {
    const result = TrackFinder._search.search(query)
    console.log(result[0], result[1])
    return result[0].item
  }
}
