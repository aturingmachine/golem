import gopermissions from '../../src/commands/implementations/gopermissions'
import { LoggerService } from '../../src/core/logger/logger.service'
import {
  PermissionCode,
  Permissions,
} from '../../src/core/permissions/permissions'
import { PermissionsService } from '../../src/core/permissions/permissions.service'
import { Errors } from '../../src/errors'
import { PermissionChangeReply } from '../../src/messages/replies/permissions-change'
import { PreformattedReply } from '../../src/messages/replies/preformatted'
import { RawReply } from '../../src/messages/replies/raw'
import { TestCommandModule } from '../mocks/command-module'

describe('Go Permissions', () => {
  let TestModule: TestCommandModule<typeof gopermissions>

  let permissionsService: jest.Mocked<PermissionsService>

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(gopermissions, [
      LoggerService,
      PermissionsService,
    ])

    permissionsService = TestModule.get(PermissionsService)
  })

  beforeEach(() => {
    TestModule.message._reset()

    TestModule.source.getUser.mockReturnValue('ksj')
    TestModule.source.getString.mockReturnValue('playlist.create playlist.edit')
  })

  describe('Get', () => {
    it('should throw if there is no user param', async () => {
      TestModule.source.getUser.mockReturnValue(undefined)

      await expect(TestModule.executeSubcommand('get')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'user',
          sourceCmd: 'perms.get',
          message: '`perms get` requires an argument for `user`.',
        })
      )
    })

    it('should throw if there is no permissions record', async () => {
      TestModule.source.getUser.mockReturnValue('ksj')
      permissionsService.lookup.mockResolvedValue(null)

      await expect(TestModule.executeSubcommand('get')).rejects.toThrow(
        Errors.NotFound({
          message: 'No permissions record found.',
          sourceCmd: 'perms.get',
          resource: 'permissions',
          identifier: 'ksj',
        })
      )
    })

    it('should reply with the permissions', async () => {
      const perms = new Permissions()
      perms.permissions = [PermissionCode.Admin]
      TestModule.source.getUser.mockReturnValue('ksj')
      permissionsService.lookup.mockResolvedValue(perms)

      await TestModule.executeSubcommand('get')

      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new RawReply(
          `\nadmin: Super User. Reserved for whomever owns this Golem.`
        )
      )
    })
  })

  describe('Set', () => {
    it('should throw if there is no user arg', async () => {
      TestModule.source.getUser.mockReturnValue(null)

      await expect(TestModule.executeSubcommand('set')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'user',
          format: '$go perms set <user-id> <...permissions>',
          sourceCmd: 'perms.set',
          message: '`perms set` requires an argument for `user`.',
        })
      )
    })

    it('should throw if there is no permissions arg', async () => {
      TestModule.source.getString.mockReturnValue(null)

      await expect(TestModule.executeSubcommand('set')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permissions',
          sourceCmd: 'perms.set',
          format: '$go perms set <user-id> <...permissions>',
          message:
            '`perms set` requires one more permission codes to set - separated by spaces.',
        })
      )
    })

    it('should throw if the permissions do not parse to permission codes', async () => {
      TestModule.source.getString.mockReturnValue('not.a.permission')

      await expect(TestModule.executeSubcommand('set')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permissions',
          sourceCmd: 'perms.set',
          format: '$go perms set <user-id> <...permissions>',
          message: `Permission set "not.a.permission" contains no valid Permission Codes. Use \`$go perms describe\` to view valid Permission Codes.`,
        })
      )
    })

    it('should not throw if there is no existing record', async () => {
      permissionsService.upsert.mockResolvedValue(new Permissions())
      permissionsService.lookup.mockResolvedValue(null)

      await TestModule.executeSubcommand('set')

      expect(permissionsService.upsert).toHaveBeenCalledWith('ksj', '211', [
        PermissionCode.PlaylistCreate,
        PermissionCode.PlaylistEdit,
      ])
      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new RawReply(
          `Permissions "playlist.create, playlist.edit" set for Sejeong.`
        )
      )
    })
  })

  describe('Add', () => {
    beforeEach(() => {
      TestModule.source.getString.mockReturnValue('playlist.create')
    })

    it('should throw if there is no user arg', async () => {
      TestModule.source.getUser.mockReturnValue(undefined)

      await expect(TestModule.executeSubcommand('add')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'user',
          sourceCmd: 'perms.add',
          format: '$go perms add <user-id> <permission>',
          message: '`perms add` requires an argument for `user`.',
        })
      )
    })

    it('should throw if the permission arg is not present', async () => {
      TestModule.source.getString.mockReturnValue(undefined)

      await expect(TestModule.executeSubcommand('add')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permission',
          sourceCmd: 'perms.add',
          format: '$go perms add <user-id> <permission>',
          message:
            'Missing required, valid Permission Code to add. Use `$go permissions describe` to see valid Permission Codes.',
        })
      )
    })

    it('should throw if the permission is not a valid code', async () => {
      TestModule.source.getString.mockReturnValue('something.else')

      await expect(TestModule.executeSubcommand('add')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permission',
          sourceCmd: 'perms.add',
          format: '$go perms add <user-id> <permission>',
          message:
            'Missing required, valid Permission Code to add. Use `$go permissions describe` to see valid Permission Codes.',
        })
      )
    })

    it('should upsert if there is an existing record', async () => {
      const perms = new Permissions()
      perms.permissions = []
      permissionsService.lookup.mockResolvedValue(perms)

      await TestModule.executeSubcommand('add')

      expect(permissionsService.lookup).toHaveBeenCalledWith('ksj', '211')
      expect(permissionsService.upsert).toHaveBeenCalledWith('ksj', '211', [
        PermissionCode.PlaylistCreate,
      ])
      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new PermissionChangeReply(
          [PermissionCode.PlaylistCreate],
          'Permissions updated for Sejeong'
        )
      )
    })

    it('should make a base record if there is no record found', async () => {
      const perms = new Permissions()
      perms.permissions = [
        ...Permissions.BasePermissions,
        PermissionCode.Moderator,
      ]
      TestModule.source.getString.mockReturnValue('moderator')
      permissionsService.lookup.mockResolvedValue(null)
      permissionsService.upsert.mockResolvedValue(perms)

      await TestModule.executeSubcommand('add')

      expect(permissionsService.lookup).toHaveBeenCalledWith('ksj', '211')
      expect(permissionsService.upsert).toHaveBeenCalledWith('ksj', '211', [
        PermissionCode.PlaylistCreate,
      ])
      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new PermissionChangeReply(
          perms.permissions,
          'Permissions created for Sejeong'
        )
      )
    })
  })

  describe('Remove', () => {
    beforeEach(() => {
      TestModule.source.getString.mockReturnValue('playlist.create')
    })

    it('should throw if there is no user arg', async () => {
      TestModule.source.getUser.mockReturnValue(undefined)

      await expect(TestModule.executeSubcommand('remove')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permission',
          sourceCmd: 'perms.remove',
          format: '$go perms remove <user-id> <permission>',
          message: 'Missing required parameter for user',
        })
      )
    })

    it('should throw if there is no permission arg', async () => {
      TestModule.source.getString.mockReturnValue(undefined)

      await expect(TestModule.executeSubcommand('remove')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permission',
          sourceCmd: 'perms.remove',
          format: '$go perms remove <user-id> <permission>',
          message:
            'Missing required, valid Permission Code to remove. Use `$go permissions describe` to see valid Permission Codes.',
        })
      )
    })

    it('should throw if there is no valid permission arg', async () => {
      TestModule.source.getString.mockReturnValue('something.else')

      await expect(TestModule.executeSubcommand('remove')).rejects.toThrow(
        Errors.BadArgs({
          argName: 'permission',
          sourceCmd: 'perms.remove',
          format: '$go perms remove <user-id> <permission>',
          message:
            'Missing required, valid Permission Code to remove. Use `$go permissions describe` to see valid Permission Codes.',
        })
      )
    })

    it('should throw if there is no existing record', async () => {
      permissionsService.lookup.mockResolvedValue(null)

      await expect(TestModule.executeSubcommand('remove')).rejects.toThrow(
        Errors.NotFound({
          message: 'No permissions record found.',
          sourceCmd: 'perms.remove',
          resource: 'permissions',
          identifier: 'ksj',
        })
      )
    })
  })

  describe('Describe', () => {
    it('should list the permissions', async () => {
      await TestModule.executeSubcommand('describe')

      expect(TestModule.message.addReply).toHaveBeenCalledWith(
        new PreformattedReply(`
admin: Super User. Reserved for whomever owns this Golem.
alias.create: Create new aliases.
alias.delete: Delete aliases.
alias.edit: Edit aliases.
moderator: Super User restricted to a Guild.
playlist.create: Create Playlists.
playlist.delete: Delete Playlists.
playlist.edit: Edit Playlists.`)
      )
    })
  })
})
