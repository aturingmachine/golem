import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'

const { combine, timestamp, colorize, printf, json, splat } = winston.format

const consoleLogFormat = printf(({ level, message, timestamp }) => {
  const d = new Date(timestamp)

  const time = d.toLocaleTimeString()
  const spaceIndex = time.indexOf(' ')
  const timeString = time
    .slice(0, spaceIndex)
    .concat(`.${d.getMilliseconds()}`)
    .concat(time.slice(spaceIndex))

  return ` <${level}> :: ${d.toLocaleDateString()} ${timeString}] ${message}`
})

const id = winston.format((info) => {
  info.id = uuidv4()

  return info
})

const logger = winston.createLogger({
  level: 'debug',
  format: combine(splat(), timestamp(), id(), json()),
  transports: [
    new winston.transports.File({
      filename: './logs/combined.log',
    }),
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), splat(), consoleLogFormat),
    }),
  ],
})

logger.error('ERROR')
logger.info('hello')

export { logger }
