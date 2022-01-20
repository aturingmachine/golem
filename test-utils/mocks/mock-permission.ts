import { MockPermission } from './models/permissions'

jest.mock('../../src/permissions/permissions', () => ({
  UserPermission: MockPermission,
}))
