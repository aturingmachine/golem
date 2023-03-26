import goadmin from '../../src/commands/implementations/goadmin'
import { AdminService } from '../../src/core/admin/admin.service'
import { LoggerService } from '../../src/core/logger/logger.service'
import { PreformattedReply } from '../../src/messages/replies/preformatted'
import { RawReply } from '../../src/messages/replies/raw'
import { TestCommandModule } from '../mocks/command-module'

describe('Go Admin', () => {
  let TestModule: TestCommandModule<typeof goadmin>

  let adminService: jest.Mocked<AdminService>

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(goadmin, [
      AdminService,
      LoggerService,
    ])

    adminService = TestModule.ref.get(AdminService)
  })

  beforeEach(() => {
    TestModule.message._reset()
  })

  describe('Bugs', () => {
    it('should not be implemented yet', async () => {
      await TestModule.executeSubcommand('bugs')

      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new RawReply('Not yet implemented.')
      )
    })
  })

  describe('LibRefresh', () => {
    it('should refresh libraries', async () => {
      adminService.refreshLibraries.mockResolvedValue({
        Kpop: 828,
      })

      await TestModule.executeSubcommand('librefresh')

      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new PreformattedReply('Refresh Results:\nKpop: 828 new listings.')
      )
    })
  })
})
