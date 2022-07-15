import { ObjectId } from 'mongodb'

type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

export type DatabaseRecord<T extends { _id: ObjectId }> =
  NonFunctionProperties<T>
