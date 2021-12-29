import { Binary, ObjectId } from 'mongodb'
import { CustomAlias } from '../aliases/custom-alias'
import { PlayRecord } from '../analytics/models/play-record'
import { LibIndex } from '../library/lib-index'
import { LocalAlbum } from '../listing/album'
import { LocalListing } from '../listing/listing'
import { UserPermission } from '../permissions/permission'
import { DatabaseRecord } from '.'

export type LocalAlbumRecord = DatabaseRecord<Omit<LocalAlbum, 'art'>> & {
  art: {
    200: Binary
    400: Binary
    1000: Binary
    original: Binary
  }
}

export type CustomAliasRecord = DatabaseRecord<CustomAlias>

export type DBPlayRecord = DatabaseRecord<PlayRecord>

export type LibIndexRecord = DatabaseRecord<LibIndex>

export type ListingRecord = DatabaseRecord<Omit<LocalListing, 'album'>> & {
  album: ObjectId
}

export type UserPermissionRecord = DatabaseRecord<UserPermission>
