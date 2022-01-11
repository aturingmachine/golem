// Disabling explicit-any since these are matching internal Jest types
/* eslint-disable @typescript-eslint/no-explicit-any  */

/**
 * Test Utility for mocking classes that extend {@link ApiService}.
 * Most of these types are here as recreations from the Jest typings,
 * programmatically mocking an object is hard to do within their
 * overload restrictions.
 *
 * Should not work for property mocking.
 */

export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

type ArgsType<T> = T extends (...args: infer A) => any ? A : never

type FuncSpy<S, K extends keyof S> = Required<S>[K] extends (
  ...args: any[]
) => any
  ? jest.SpyInstance<ReturnType<Required<S>[K]>, ArgsType<Required<S>[K]>>
  : never

// type FunctionProps<S> = {
//   [K in keyof S]: S[K] extends (...args: any[]) => any ? K : never
// }[keyof S]

export type InnerMock<S> = {
  -readonly [K in keyof S]: S[K] extends (...args: any[]) => any
    ? FuncSpy<S, K>
    : S[K]
}

export type Mocked<S> = {
  -readonly [K in keyof S]: S[K] extends (...args: any[]) => any
    ? FuncSpy<S, K>
    : S[K] extends string | number | boolean | void | undefined
    ? S[K]
    : InnerMock<S[K]>
}

function isServiceFunction<S>(
  service: S,
  property: keyof S
): property is keyof Mocked<S> {
  try {
    return (
      service?.[property] !== undefined &&
      typeof service?.[property] === 'function' &&
      property !== 'constructor'
    )
  } catch (error) {
    return false
  }
}

const getAllPropertyNames = (obj: any): string[] => {
  const props: string[] = []

  do {
    if (!obj) {
      continue
    }

    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (!props.includes(prop)) {
        props.push(prop)
      }
    })
  } while (!!obj && (obj = Object.getPrototypeOf(obj)))

  return props
}

export const makeInnerMock = <S>(service: S): InnerMock<S> => {
  if (service === undefined) {
    return service as InnerMock<S>
  }

  const propSet = getAllPropertyNames(service)

  return Object.fromEntries(
    propSet
      .filter((property: string | keyof S) =>
        isServiceFunction(service, property as keyof S)
      )
      .map((property) => {
        const key = property as keyof S
        const spy =
          service !== undefined && isServiceFunction(service, key)
            ? jest.spyOn(service, property as any)
            : service[key]

        return [property, spy]
      })
      .filter(([_prop, val]) => val !== undefined)
  )
}

/**
 * Gets all enumerable and non-enumerable methods of a given class and
 * mocks them.
 *
 * @param {S} service A class that
 * @returns {Mocked<S>} An object containing mocks of all functions of the service class.
 */
export const deepMock = <S>(service: S): Mocked<S> => {
  if (service === undefined) {
    return service as Mocked<S>
  }

  const propSet = getAllPropertyNames(service)

  return Object.fromEntries(
    propSet
      // .filter((property: string | keyof S) =>
      //   isServiceFunction(service, property as keyof S)
      // )
      .map((property) => {
        const key = property as keyof S
        const spy = isServiceFunction(service, key)
          ? jest.spyOn(service, property as any)
          : typeof service[key] === 'object'
          ? makeInnerMock(service[key])
          : service[key]
        return [property, spy]
      })
      .filter(([_prop, val]) => val !== undefined)
  )
}

export function addStaticMocks(
  // eslint-disable-next-line @typescript-eslint/ban-types
  o: object,
  ...funcNames: (string | [string, any])[]
): void {
  const mockProps = Object.fromEntries(
    funcNames.map((f) => {
      if (typeof f === 'string') {
        return [f, { value: jest.fn() }]
      }

      return [f[0], { value: f[1] }]
    })
  )

  Object.defineProperties(o, mockProps)
}
