export class Config {
  static get token(): string {
    return process.env.TOKEN || ''
  }

  static get clientId(): string {
    return process.env.CLIENT_ID || ''
  }

  static get guildId(): string {
    return process.env.TEST_SERVER_GUILD_ID || ''
  }
}
