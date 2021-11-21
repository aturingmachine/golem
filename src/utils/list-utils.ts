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

export const ArrayUtils = {
  shuffleArray,
  isDefined,
}
