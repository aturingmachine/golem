import { ModuleRef } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { MockGolemMessage, MockMessage } from '../specs/mocks/mock-message'
import { CustomAlias } from '../src/core/alias/alias.model'
import { AliasService } from '../src/core/alias/alias.service'
import { MessageController } from '../src/core/message.controller'
import { RawReply } from '../src/messages/replies/raw'
import { ProcessingTree } from '../src/messages/tree'
import { AutoMock, Mockify } from './mocks/auto-mocker'

describe('Message Controller', () => {
  let controller: MessageController

  let treeService: jest.Mocked<ProcessingTree>
  let aliasService: jest.Mocked<AliasService>

  let message: MockMessage

  beforeEach(async () => {
    const mockRef: jest.Mocked<ModuleRef> = Mockify(ModuleRef)
    mockRef.resolve.mockImplementation(Mockify)

    const moduleRef = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: ModuleRef,
          useValue: mockRef,
        },
      ],
    })
      .useMocker(AutoMock())
      .compile()

    controller = moduleRef.get(MessageController)

    treeService = moduleRef.get(ProcessingTree)
    aliasService = moduleRef.get(AliasService)

    message = new MockMessage()

    MockGolemMessage._reset()
    MockGolemMessage._replies.render.mockReturnValue([
      new RawReply('Test Reply'),
    ])
  })

  it('should do nothing if the message does not start with a $', async () => {
    await controller.handleMessage({ message: message._cast() })

    expect(aliasService.findAliases).not.toHaveBeenCalled()
    expect(aliasService.injectHits).not.toHaveBeenCalled()
    expect(treeService._execute).not.toHaveBeenCalled()
    expect(MockGolemMessage._replies.render).not.toHaveBeenCalled()
  })

  it('should not inject alias hits if there is no alias in the message', async () => {
    message._setContent('$go play twice tt')

    await controller.handleMessage({ message: message._cast() })

    expect(aliasService.findAliases).toHaveBeenCalled()
    expect(aliasService.injectHits).not.toHaveBeenCalled()
    expect(treeService._execute).toHaveBeenCalled()
    expect(MockGolemMessage._replies.render).toHaveBeenCalled()
  })

  it('should inject aliases if the alias service returns hits', async () => {
    const messageContent = '$aliased_command'

    const alias = new CustomAlias()
    alias.name = 'aliased_command'
    alias.source = '$go play twice tt'
    aliasService.findAliases.mockResolvedValue([{ index: 0, alias }])
    aliasService.injectHits.mockReturnValue(alias.source)

    message._setContent(messageContent)

    await controller.handleMessage({ message: message._cast() })

    expect(aliasService.findAliases).toHaveBeenCalled()
    expect(aliasService.injectHits).toHaveBeenCalledWith(messageContent, [
      { index: 0, alias },
    ])
    expect(treeService._execute).toHaveBeenCalled()
    expect(MockGolemMessage._replies.render).toHaveBeenCalled()
  })

  it('should not allow multiple unique replies', async () => {
    const replies = [
      {
        isUnique: true,
        type: 'FakeUniqueReply',
        opts: { content: 'Fake-Unique-1' },
      },
      {
        isUnique: true,
        type: 'FakeUniqueReply',
        opts: { content: 'Fake-Unique-2' },
      },
    ]

    MockGolemMessage._replies.render.mockReturnValue(replies as any[])

    message._setContent('$go play twice tt')

    await controller.handleMessage({ message: message._cast() })

    expect(aliasService.findAliases).toHaveBeenCalled()
    expect(aliasService.injectHits).not.toHaveBeenCalled()
    expect(treeService._execute).toHaveBeenCalled()
    expect(MockGolemMessage._replies.render).toHaveBeenCalled()
    expect(MockGolemMessage.reply).toHaveBeenCalledTimes(1)
  })

  it('should allow multiple unique replies of different types', async () => {
    const replies = [
      {
        isUnique: true,
        type: 'FakeUniqueReply',
        opts: { content: 'Fake-Unique-1' },
      },
      {
        isUnique: true,
        type: 'FakeUniqueReply',
        opts: { content: 'Fake-Unique-2' },
      },
      {
        isUnique: true,
        type: 'FakeUniqueReply_Different_type',
        opts: { content: 'Fake-Unique-3' },
      },
    ]

    MockGolemMessage._replies.render.mockReturnValue(replies as any[])

    message._setContent('$go play twice tt')

    await controller.handleMessage({ message: message._cast() })

    expect(aliasService.findAliases).toHaveBeenCalled()
    expect(aliasService.injectHits).not.toHaveBeenCalled()
    expect(treeService._execute).toHaveBeenCalled()
    expect(MockGolemMessage._replies.render).toHaveBeenCalled()
    expect(MockGolemMessage.reply).toHaveBeenCalledTimes(2)
  })
})
