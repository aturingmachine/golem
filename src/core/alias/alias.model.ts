import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'

interface AliasFunctionRecord {
  /**
   * The Unique name of the Golem Function we want to invoke.
   */
  name: string

  /**
   * The list of parameters parsed from the function call.
   */
  parameters: unknown[]

  /**
   * The index of this occurrence of this function.
   * i.e "The second instance of 'range' in this alias script"
   */
  index: number
}

@Entity()
export class CustomAlias {
  @ObjectIdColumn()
  _id!: ObjectID

  /**
   * The User ID of whomever created the alias.
   */
  @Column()
  authorId!: string

  /**
   * The ID of the Server the alias is registered for.
   */
  @Column()
  guildId!: string

  /**
   * The name or "invoker" of the alias.
   */
  @Column()
  name!: string

  /**
   * The Raw "source code" of the alias.
   */
  @Column()
  source!: string

  @Column()
  functions!: AliasFunctionRecord[]

  /**
   * An optional description of the alias
   */
  @Column()
  description?: string

  prettyPrint(): string {
    const descString = this.description ? `\n\t${this.description}` : ''
    return `${this.name}: ${this.source}${descString}`
  }
}
