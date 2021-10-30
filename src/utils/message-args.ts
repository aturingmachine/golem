export function parseMessageArgs(message: string): {
  base: string
  args: Record<string, string>
} {
  const args = Object.fromEntries(
    message
      .slice(message.indexOf(' -- '))
      .split(' ')
      .map((argPair) => argPair.split('='))
  )

  return {
    base:
      message.indexOf(' -- ') > 0
        ? message.slice(0, message.indexOf(' -- '))
        : message,
    args,
  }
}
