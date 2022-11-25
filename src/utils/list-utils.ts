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

export const ArrayUtils = {
  shuffleArray,
  isDefined,
  setFrom,
  remove,
}
