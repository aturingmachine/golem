import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'

@Entity()
export class AuditRecord {
  @ObjectIdColumn()
  _id!: ObjectID

  /**
   * The messages trace id
   */
  @Column()
  traceId!: string

  /**
   * The user who's interaction created this audit log
   */
  @Column()
  userId!: string

  /**
   * The guild the audit was generated from
   */
  @Column()
  guildId!: string

  /**
   * The raw message content that generated this audit
   */
  @Column()
  raw!: string

  /**
   * The fully evaluated command that generated this audit
   */
  @Column()
  expanded!: string

  @Column()
  error: Error | any

  @Column()
  timestamp!: number
}
