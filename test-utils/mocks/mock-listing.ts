import { MockLocalListing } from './models/listing'

jest.mock('../../src/listing/listing', () => ({
  LocalListing: MockLocalListing,
}))
