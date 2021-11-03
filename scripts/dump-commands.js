/* eslint-disable @typescript-eslint/no-var-requires */

const { writeFileSync } = require('fs')
const path = require('path')
const { RegisteredCommands } = require('../dist/commands')

const helpInfo = Object.values(RegisteredCommands)
// .map((cmd) => {
//   return cmd.options.info
// })

writeFileSync(
  path.resolve(__dirname, '../docs/src/.vuepress/data/commands.json'),
  JSON.stringify(helpInfo)
)
