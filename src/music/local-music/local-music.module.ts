import { Module } from '@nestjs/common'
import { ListingLoader } from '../../listing/listing-loaders'
import { ListingFinder } from '../../search/track-finder'

@Module({
  providers: [ListingFinder, ListingLoader],
  exports: [ListingFinder, ListingLoader],
})
export class LocalMusicModule {}
