// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatForLog = (obj: Record<string, any>): string => {
  return Object.entries(obj).reduce((prev, curr) => {
    const isObj = typeof curr[1] === 'object' && !Array.isArray(curr[1])
    return prev.concat(
      `${curr[0]}=${isObj ? `{ ${formatForLog(curr[1])}}` : curr[1]}; `
    )
  }, '')
}
