import { LogLevel } from '@nestjs/common'
import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'

@Entity()
export class LogLine {
  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  message!: string

  @Column()
  context!: string

  @Column()
  level!: LogLevel
}
