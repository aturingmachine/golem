const colorClasses = {
  blue: 'blue',
  blueBright: 'blue-bright',
  cyan: 'cyan',
  cyanBright: 'cyan-bright',
  green: 'green',
  greenBright: 'green-bright',
  magenta: 'magenta',
  magentaBright: 'magenta-bright',
  yellow: 'yellow',
  orange: 'orange',
  red: 'red',
}

export const logInfoClassMappings= {
  'artist-button': colorClasses.magentaBright,
  'button-handler': colorClasses.blue,
  'cmd-deploy': colorClasses.green,
  'cmd-register': colorClasses.yellow,
  'db-con': colorClasses.cyan,
  'db-debug': colorClasses.green,
  'go-mix': colorClasses.greenBright,
  'go-pause': colorClasses.magenta,
  'go-peek': colorClasses.magentaBright,
  'go-play': colorClasses.blue,
  'go-playlist': colorClasses.green,
  'go-search': colorClasses.yellow,
  'go-shuffle': colorClasses.magenta,
  'go-skip': colorClasses.magentaBright,
  'go-stop': colorClasses.blue,
  'interaction-create': colorClasses.green,
  'last-fm': colorClasses.magentaBright,
  'legacy-handler': colorClasses.green,
  'message-create': colorClasses.yellow,
  'mix-debug': colorClasses.blueBright,
  'music-player': colorClasses.magentaBright,
  'playlist-menu': colorClasses.yellow,
  'web-server': colorClasses.magenta,
  'wide-search': colorClasses.magenta,
  analytics: colorClasses.cyanBright,
  app: colorClasses.blue,
  client: colorClasses.magenta,
  debugger: colorClasses.yellow,
  loader: colorClasses.yellow,
  mixer: colorClasses.cyanBright,
  plex: colorClasses.magenta,
  queue: colorClasses.blue,
  search: colorClasses.green,
  info: colorClasses.greenBright,
  debug: colorClasses.blueBright,
  warn: colorClasses.orange,
  error: colorClasses.red,
}

const colorVals = Object.values(colorClasses)

export function getLogInfoColor(src) {
  let color = logInfoClassMappings[src]
  console.log(color)

  if (!color) {
    color = colorVals[Math.floor(Math.random()*colorVals.length)]
    console.log('random', color)
    logInfoClassMappings[src] = color

    console.log(logInfoClassMappings)
  }

  return color
}
