import { ModuleRef } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { GolemCommand } from '../../src/commands'
import { AutoMock, InjectionToken, MockProvide } from './auto-mocker'
import { MockGolemMessage } from './mock-message'
import { MockedParsedCommand, MockParsedCommand } from './mock-parsed-command'

// export type TestCommandModule<T extends GolemCommand<any>> = {
//   ref: TestingModule
//   command: T
//   message: typeof MockGolemMessage
//   source: MockedParsedCommand
//   execute(): Promise<void>
// }

export class TestCommandModule<T extends GolemCommand<any>> {
  constructor(
    public ref: TestingModule,
    public command: T,
    public message: typeof MockGolemMessage,
    public source: MockedParsedCommand,
    readonly tokens: InjectionToken[]
  ) {}

  static async init<T extends GolemCommand<any>>(
    command: T,
    tokens: InjectionToken[]
  ): Promise<TestCommandModule<T>> {
    const moduleRef = await Test.createTestingModule({
      providers: MockProvide(tokens),
    })
      .useMocker(AutoMock())
      .compile()

    await command.init(moduleRef as unknown as ModuleRef)

    const source = MockParsedCommand()

    const module = new TestCommandModule(
      moduleRef,
      command,
      MockGolemMessage,
      source,
      tokens
    )

    return module
  }

  get: ModuleRef['get'] = (token) => {
    return this.ref.get(token)
  }

  async execute(): Promise<void> {
    await this.command.execute({
      message: MockGolemMessage._cast(),
      source: this.source._cast(),
    })
  }

  async executeSubcommand(key: string): Promise<void> {
    const definition = this.command.options.subcommands?.[key]

    if (!definition) {
      throw new Error(`No subcommand of name: ${key}`)
    }

    await definition.handler.bind(this.command)({
      message: MockGolemMessage._cast(),
      source: this.source._cast(),
    })
  }

  async reset(): Promise<void> {
    this.source._reset()
    this.message._reset()

    for (const token of this.tokens) {
      const target = await this.ref.get(token)

      const keys = Object.keys(target)

      keys.forEach((key) => {
        const castKey = key as keyof typeof target

        if (typeof target[castKey] === 'function') {
          target[castKey].mockClear()
        }
      })
    }
  }
}

// export async function MockCommandModule<T extends GolemCommand<any>>(
//   command: T,
//   tokens: InjectionToken[]
// ): Promise<TestCommandModule<T>> {
//   const moduleRef = await Test.createTestingModule({
//     providers: MockProvide(tokens),
//   })
//     .useMocker(AutoMock())
//     .compile()

//   await command.init(moduleRef as unknown as ModuleRef)

//   const source = MockParsedCommand()

//   return {
//     ref: moduleRef,
//     command,
//     message: MockGolemMessage,
//     source,
//     async execute(): Promise<void> {
//       await command.execute({
//         message: MockGolemMessage._cast(),
//         source: source._cast(),
//       })
//     },
//   }
// }
