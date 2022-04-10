const YAML = require('yaml')
const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const composePath = resolve(__dirname, '../docker/docker-compose.volumes.yml')
const configPath = resolve(__dirname, '../config.yml')

const extended = {
  services: {
    golem: {
      volumes: []
    }
  }
}

let config = YAML.parse(readFileSync(configPath, { encoding: 'utf-8' }))
console.log('Mapping Source Paths:\n', config.library.paths.join('\n'))

config.library.paths.forEach((path, index) => {
  extended.services.golem.volumes.push(`${path}:${path}`)
})

console.log('Adding volumes:\n', extended.services.golem.volumes.join('\n'))
writeFileSync(composePath, YAML.stringify(extended), { encoding: 'utf-8' })
