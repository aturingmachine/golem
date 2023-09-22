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

export function chonk<T>(arr: T[], chonk_size: number): T[][] {
  return arr.reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index/chonk_size)

    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [] as T[][])
}
