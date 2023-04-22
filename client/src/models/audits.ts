export type AuditRecord = {
  _id: string

  /**
   * The messages trace id
   */
  traceId: string

  /**
   * The user who's interaction created this audit log
   */
  userId: string

  /**
   * The guild the audit was generated from
   */
  guildId: string

  /**
   * The raw message content that generated this audit
   */
  raw: string

  /**
   * The fully evaluated command that generated this audit
   */
  expanded: string

  error: Error | any
  timestamp: number
}
