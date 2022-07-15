// import { Injectable } from '@nestjs/common'
// import { LocalListing } from '../../listing/listing'
// import { MixMatcher } from '../../music/player/mixing/mix-matcher'
// import { ListingFinder } from '../../search/track-finder'

// @Injectable()
// export class MixDebugger {
//   constructor(private trackFinder: ListingFinder) {}

//   async debug(cmd: string): Promise<void> {
//     const queryString = cmd.split(' ').slice(0, 2).join(' ')
//     const mixType = cmd.split(' ')[1]
//     const search = this.trackFinder.search(queryString)

//     if (search) {
//       try {
//         switch (mixType) {
//           case 'track':
//           case 't':
//             this.track(search.listing)
//             break
//           default:
//           case 'artist':
//           case 'a':
//             this.artist(search.listing)
//             break
//         }
//       } catch (error) {
//         console.error(error)
//       }
//     } else {
//     }
//   }

//   private async artist(listing: LocalListing): Promise<void> {
//     try {
//       const similar = await MixMatcher.similarArtists(listing)
//       similar.map((s) => s.shortName)
//     } catch (error) {
//       console.error(error)
//     }
//   }

//   private async track(listing: LocalListing): Promise<void> {
//     try {
//       const similar = await MixMatcher.similarTracks(listing)
//       similar.map((s) => s.shortName)
//     } catch (error) {
//       console.error(error)
//     }
//   }
// }
