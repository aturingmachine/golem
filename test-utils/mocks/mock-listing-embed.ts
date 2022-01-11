import { MockListingEmbed } from './listing'

jest.mock('../../src/messages/replies/listing-embed.ts', () => ({
  ListingEmbed: MockListingEmbed,
}))
