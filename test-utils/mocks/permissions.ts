import { UserPermission } from '../../src/permissions/permission'
import { addStaticMocks, Overwrite } from '../mocks'
import { MockMongoCollection } from './mongodb-collection'

type MockPermInstance = {
  permArray: any[]
  isAdmin: boolean
  can: jest.Mock
  add: jest.Mock
  remove: jest.Mock
  save: jest.Mock
}

export const MockPermission = jest.fn(() => ({
  permArray: [],
  isAdmin: false,
  can: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
}))
// .mockImplementation(() => ({
//   permArray: [],
//   isAdmin: false,
//   can: jest.fn(),
//   add: jest.fn(),
//   remove: jest.fn(),
//   save: jest.fn(),
// }))

addStaticMocks(
  MockPermission,
  'findOne',
  'get',
  'check',
  'fromData',
  'checkPermissions',
  ['Collection', MockMongoCollection()]
)

export type MockPermission = (() => MockPermInstance) &
  Overwrite<
    jest.MockedClass<typeof UserPermission>,
    {
      Collection: typeof MockMongoCollection
    }
  >

export const MockedPermission = UserPermission as any as MockPermission
