import { MockLocalListing } from './listing'

jest.mock('../../src/listing/listing', () => ({
  LocalListing: MockLocalListing,
}))
