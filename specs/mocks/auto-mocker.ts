/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleRef } from '@nestjs/core'
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock'
import { LoggerService } from '../../src/core/logger/logger.service'

export interface Type<T = any> extends Function {
  new(...args: any[]): T
}
export interface Abstract<T> extends Function {
  prototype: T
}

export declare type InjectionToken =
  | string
  | symbol
  | Type<any>
  | Abstract<any>
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function

export declare type MockFactory = (token?: InjectionToken) => any

export const Mockify = (token: InjectionToken) => {
  const moduleMocker = new ModuleMocker(global)
  if (token === ModuleRef) {
    return {
      resolve: jest.fn(),
    }
  }

  const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<
    any,
    any
  >

  const Mock = moduleMocker.generateFromMetadata(mockMetadata)

  const instance = new Mock()

  if (token === LoggerService) {
    instance.info.mockImplementation((...args: any[]) => {
      console.log('[INFO]', ...args)
    })

    instance.info.mockImplementation((...args: any[]) => {
      console.log('[DEBUG]', ...args)
    })
  }

  return instance
}

export function AutoMock(_tokens: InjectionToken[] = []): MockFactory {
  const moduleMocker = new ModuleMocker(global)

  return (token) => {
    if (token === ModuleRef) {
      return {
        resolve: jest.fn(),
      }
    }

    const mockMetadata = moduleMocker.getMetadata(
      token
    ) as MockFunctionMetadata<any, any>

    const Mock = moduleMocker.generateFromMetadata(mockMetadata)

    const instance = new Mock()

    if (token === LoggerService) {
      instance.info.mockImplementation((...args: any[]) => {
        console.log('[INFO]', ...args)
      })

      instance.info.mockImplementation((...args: any[]) => {
        console.log('[DEBUG]', ...args)
      })
    }

    return instance
  }
}

export function MockProvide(tokens: InjectionToken[]) {
  const factory = AutoMock()

  return tokens.map((token) => {
    return {
      provide: token,
      useValue: factory(token),
    }
  })
}
