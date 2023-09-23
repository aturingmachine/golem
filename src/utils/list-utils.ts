const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }

  return arr
}

const isDefined = <T>(input: T | undefined | null): input is T => {
  return typeof input !== 'undefined' && input !== null
}

const setFrom = <T>(list: T[]): T[] => {
  return Array.from(new Set(list))
}

const remove = <T>(list: T[], target: T): T[] => {
  const index = list.findIndex((item) => item === target)

  if (index > -1) {
    // only splice array when item is found
    list.splice(index, 1) // 2nd parameter means remove one item only
  }

  return list
}

const safeArray = <T>(item: T | T[]): T[] => {
  return Array.isArray(item) ? item : [item]
}

export const ArrayUtils = {
  shuffleArray,
  isDefined,
  setFrom,
  remove,
  safeArray,
}

export class KeyedSet<T, K extends keyof T> {
  private readonly key: K
  private readonly limit: number
  private items: T[] = []

  constructor(key: K, limit?: number, items?: T[]) {
    this.key = key
    this.items = items || []
    this.limit = limit || -1
  }

  get size(): number {
    return this.items.length
  }

  get keys(): T[K][] {
    return this.items.map((i) => i[this.key])
  }

  get isAtLimit(): boolean {
    return this.limit > 0 ? this.size >= this.limit : false
  }

  values(): T[] {
    return this.items
  }

  contains(item?: T): boolean {
    if (!item) {
      return false
    }

    return this.keys.includes(item[this.key])
  }

  get(id: T[K]): T | undefined {
    return this.items.find((p) => p[this.key] === id)
  }

  add(newItems?: T | T[]): number {
    if (!newItems) {
      return this.size
    }

    const arr = ArrayUtils.safeArray(newItems)

    let index = 0

    while (!!arr[index] && !this.isAtLimit) {
      const newItem = arr[index]

      if (!this.contains(newItem)) {
        this.items.push(newItem)
      }

      index++
    }

    return this.size
  }

  remove(id: T[K]): void {
    const index = this.indexOf(id)

    if (index < 0) {
      return
    }

    this.items.splice(index, 1)
  }

  indexOf(item: T[K]): number {
    return this.items.findIndex((p) => p[this.key] === item)
  }
}
