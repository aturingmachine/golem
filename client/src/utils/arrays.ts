export function removeItem<T>(search: T, arr: T[]): T[] {
  const index = arr.findIndex((val) => val === search)

  // return [...arr.slice(0,index), ...arr.slice(index+1, arr.length)]

  return index >= 0 ? arr.splice(arr.indexOf(search), 1) : arr
}

export function safeArray<T>(source?: T | T[]): T[] {
  if (!source) {
    return []
  }

  return Array.isArray(source) ? source : [source]
}
