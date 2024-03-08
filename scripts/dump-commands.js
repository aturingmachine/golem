/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require('child_process')
const { writeFileSync } = require('fs')
const path = require('path')

// execSync('npm run build')

const helpInfo = Object.values(
  require('../dist/commands/register-commands').RegisteredCommands
)

writeFileSync(
  path.resolve(__dirname, '../docs/src/.vuepress/data/commands.json'),
  JSON.stringify(helpInfo)
)
