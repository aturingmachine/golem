/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const commands = require('./src/.vuepress/data/commands.json')

const commandTemplate = readFileSync(
  path.resolve(__dirname, './command-template.md'),
  { encoding: 'utf-8' }
)

commands.forEach((cmd) => {
  console.log(`[DOCGEN] Rending page for command ${cmd.options.info.name}`)
  const fp = path.resolve(
    __dirname,
    `./src/commands/${cmd.options.info.name}.md`
  )

  const content = commandTemplate
    .replaceAll('<%name>', cmd.options.info.name)
    .replaceAll('<%command>', JSON.stringify(cmd))

  writeFileSync(fp, content, { encoding: 'utf-8' })
  console.log(`[DOCGEN] Page rendered at ${fp}`)
})
