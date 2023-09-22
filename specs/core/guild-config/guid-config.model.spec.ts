import { GuildConfig } from '../../../src/core/guild-config/guild-config.model'

describe('Guild Config Model', () => {
  describe('describe', () => {
    it('should return a description of the settings', () => {
      expect(GuildConfig.describe()).toEqual(`**Golem Bot - Guild Settings**
\`defaultChannelId\` - the channel to send updates to
\`subscribedToUpdates\` - whether or not to send updates to this guild's \"defaultChannelId\"`)
    })
  })
})
