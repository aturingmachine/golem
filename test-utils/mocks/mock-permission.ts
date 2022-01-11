import { MockPermission } from './permissions'

jest.mock('../../src/permissions/permissions', () => ({
  UserPermission: MockPermission,
}))
