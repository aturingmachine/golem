export const humanReadableTime = (totalSeconds: number): string => {
  if (!totalSeconds) {
    return 'Now'
  }

  let seconds = totalSeconds
  const hours = Math.floor(totalSeconds / 3600)
  seconds %= 3600
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  seconds = seconds % 60

  return `${hours}:${minutes}:${(Math.round(seconds * 100) / 100).toFixed(2)}`
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
