import { GSCompiler } from '../src/ast/compiler'
import { ConfigurationService } from '../src/core/configuration.service'

describe('GSCompiler', () => {
  beforeAll(() => {
    ConfigurationService.init()
    ConfigurationService.set('logLevels', ['log', 'error', 'warn', 'debug'])
  })

  it('should', () => {
    const result = GSCompiler.fromString(
      '$play https://www.youtube.com/playlist?list=PLbxr0tBuEEpF1PFiDIwUkdDR5dsfx1ZUr --limit=100 --shuffle'
    )

    console.log(result)
  })
})
