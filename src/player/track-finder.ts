import fs from 'fs'
import { Config } from '../utils/config'

export class TrackFinder {
  static search(_query: string): void {
    const dir = fs.readdirSync(Config.libraryPath)
    console.log(dir)
  }
}
