import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import { TrackType } from '../tracks'

type PlaylistListing = {
  source: TrackType
  id: string
}

@Entity()
export class Playlist {
  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  name!: string

  /**
   * Not sure the best thing to put here...
   */
  @Column()
  listings!: PlaylistListing[]

  @Column()
  ownerId!: string

  @Column()
  guildId!: string
}
