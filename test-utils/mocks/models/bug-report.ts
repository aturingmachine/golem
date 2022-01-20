import { MockMongoCollection } from '../mongodb-collection'

export type MockedBugReport = {
  toString: jest.Mock
  save: jest.Mock
}

const mockReportConstructor = jest
  .fn<MockedBugReport, []>()
  .mockImplementation(() => ({
    toString: jest.fn(),
    save: jest.fn(),
  }))

export const MockBugReport = Object.assign(mockReportConstructor, {
  find: jest.fn(),
  fromMessage: jest.fn(),
  collection: MockMongoCollection(),
})
