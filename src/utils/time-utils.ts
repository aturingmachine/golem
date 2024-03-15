import { promisify } from 'util'

export const humanReadableTime = (totalSeconds: number): string => {
  if (!totalSeconds) {
    return 'Now'
  }

  let seconds = totalSeconds
  const hours = Math.floor(totalSeconds / 3600)
  const hoursString = hours ? `${hours}:` : ''
  seconds %= 3600
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  seconds = seconds % 60

  return `${hoursString}${minutes}:${(Math.round(seconds * 100) / 100)
    .toFixed(0)
    .padStart(2, '0')}`
}

export const humanReadableDuration = (totalSeconds: number): string => {
  if (!totalSeconds) {
    return '-'
  }

  let seconds = totalSeconds
  const minutes = Math.floor(seconds / 60)
  seconds = seconds % 60

  return `${minutes}:${(Math.round(seconds * 100) / 100)
    .toFixed(0)
    .padStart(2, '0')}`
}

export const wait = promisify(setTimeout)

export class JobTimer<T> {
  private start_time!: number
  private end_time!: number

  constructor(readonly name: string, readonly cb: () => T | Promise<T>) {}

  async run(): Promise<T> {
    this.start_time = Date.now()

    const result = await this.cb()

    this.end_time = Date.now()

    return result
  }

  get duration(): string {
    return this.start_time && this.end_time
      ? humanReadableDuration((this.end_time - this.start_time) / 1000)
      : 'Has Not Exectuted.'
  }
}

type WaitUntilOptions = {
  maxTries?: number
  waitTime?: number
  timeoutHandler?: () => Promise<void> | void
}

export async function waitUntil(
  fn: () => Promise<boolean> | boolean,
  options?: WaitUntilOptions
): Promise<void> {
  let tries = 0

  const {
    maxTries = 3,
    waitTime = 1000,
    timeoutHandler = () => {
      throw new Error('Maxed out retrying opertaion.')
    },
  } = options || {}

  const doTry = async () => {
    if (tries > maxTries) {
      await timeoutHandler()
    }

    tries++

    const res = await fn()

    if (!res) {
      await wait(waitTime)
      await doTry()
    }
  }

  await doTry()
}
