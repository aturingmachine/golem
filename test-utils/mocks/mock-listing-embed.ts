import { MockListingEmbed } from './models/listing'

jest.mock('../../src/messages/replies/listing-embed.ts', () => ({
  ListingEmbed: MockListingEmbed,
}))
