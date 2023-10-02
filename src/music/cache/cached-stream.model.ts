import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'

export enum CachedStreamType {
  YouTube = 'YouTube',
}

@Entity()
export class CachedStream {
  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  type!: CachedStreamType

  @Column()
  external_id!: string

  @Column()
  title!: string

  @Column()
  artist!: string

  @Column()
  thumbnail!: string

  @Column()
  initial_cache_date!: Date

  @Column()
  last_access_date!: Date
}
