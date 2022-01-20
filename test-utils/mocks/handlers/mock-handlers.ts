import { MockAdminHandler } from './admin'
import { MockHandlers } from './handlers'

jest.mock('../../../src/admin/admin-handler', () => ({
  AdminHandler: MockAdminHandler,
}))

jest.mock('../../../src/handlers', () => ({
  __esModule: true,
  Handlers: MockHandlers,
}))
