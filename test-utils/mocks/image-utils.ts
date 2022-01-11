import { ImageUtils } from '../../src/utils/image-utils'

jest.mock('../../src/utils/image-utils.ts')

export const MockImageUtils = (): jest.Mocked<typeof ImageUtils> =>
  ImageUtils as jest.Mocked<typeof ImageUtils>
