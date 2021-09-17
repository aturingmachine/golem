// export type DBSchema = LibIndex

import { GolemBotInteraction } from '../../analytics/models/interaction'
import { Listing } from '../listing'
import { LibIndex } from './lib-index'

export type DatabaseResource = LibIndex | Listing | GolemBotInteraction
