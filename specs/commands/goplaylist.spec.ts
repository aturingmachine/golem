import '../../test-utils/mocks/mock-message'
import '../../test-utils/mocks/mock-listing'
import '../../test-utils/mocks/mock-track'
import '../../test-utils/mocks/mock-replier'
import '../../test-utils/mocks/mock-playlist-menu'
import goplaylist from '../../src/commands/implementations/goplaylist'
import { executeCommand } from '../../test-utils'
import { MockGolem } from '../../test-utils/mocks/golem'
import { MockPlaylistMenu } from '../../test-utils/mocks/mock-playlist-menu'
import { MockLocalListing } from '../../test-utils/mocks/models/listing'
import {
  MockedMessage,
  MockMessage,
} from '../../test-utils/mocks/models/message'
import { MockLocalTrack } from '../../test-utils/mocks/models/track'

describe('goplaylist', () => {
  let mockMessage: MockedMessage

  beforeEach(() => {
    mockMessage = new MockMessage()
  })

  describe('With playlist name', () => {
    beforeEach(() => {
      mockMessage.parsed.getString.mockReturnValue('playlist-1')
    })

    it('should enqueue results from the found playlist', async () => {
      const localListing = new MockLocalListing()
      MockGolem.trackFinder.findListingsByIds.mockReturnValue([localListing])
      const localTrack = new MockLocalTrack()
      MockLocalTrack.fromListings.mockReturnValue([localTrack])
      MockGolem.plex.playlists = [
        { name: 'playlist-1', count: 0, listings: [] },
      ]

      await executeCommand(goplaylist, mockMessage)

      expect(mockMessage.player.enqueueMany).toHaveBeenCalledWith('ksj', [
        localTrack,
      ])
      expect(mockMessage.reply).toHaveBeenCalledWith(
        `affirmative, I'll queue up playlist-1`
      )
    })

    it('should reply that it couldnt find a playlist of that name if one is not found', async () => {
      MockGolem.plex.playlists = [
        { name: 'playlist-2', count: 0, listings: [] },
      ]

      await executeCommand(goplaylist, mockMessage)

      expect(mockMessage.reply).toHaveBeenCalledWith(
        'No playlist found with name playlist-1'
      )
    })
  })

  describe('Without playlist name', () => {
    it('should send a playlist menu and collect responses', async () => {
      mockMessage.parsed.getString.mockReturnValue(null)

      await executeCommand(goplaylist, mockMessage)

      expect(MockPlaylistMenu.send).toHaveBeenCalledTimes(1)
      expect(MockPlaylistMenu.collectResponse).toHaveBeenCalledTimes(1)
    })
  })
})
