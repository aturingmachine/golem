import {
  Column,
  Entity,
  ObjectID,
  ObjectIdColumn,
  CreateDateColumn,
} from 'typeorm'

@Entity()
export class Library {
  @ObjectIdColumn()
  id!: ObjectID

  @CreateDateColumn()
  created_at!: string

  @Column()
  name: string

  @Column()
  count: number

  @Column()
  listingIds: ObjectID[]

  constructor(name: string, count: number, listingIds: ObjectID[]) {
    this.name = name
    this.count = count
    this.listingIds = listingIds
  }
}
