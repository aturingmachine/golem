import { ObjectID } from 'typeorm'
import goplaylist from '../../src/commands/implementations/goplaylist'
import { LoggerService } from '../../src/core/logger/logger.service'
import { PlexService } from '../../src/integrations/plex/plex.service'
import { MessageBuilderService } from '../../src/messages/message-builder.service'
import { ListingLoaderService } from '../../src/music/local/library/loader.service'
import { PlayQueryService } from '../../src/music/player/play-query.service'
import { PlayerService } from '../../src/music/player/player.service'
import { Playlist } from '../../src/music/playlists/playlist.model'
import { PlaylistService } from '../../src/music/playlists/playlist.service'
import { TrackType } from '../../src/music/tracks'
import { MockObjectId } from '../../test-utils'
import { TestCommandModule } from '../mocks/command-module'
import { Mocker } from '../mocks/data'
import { MockGolemMessage } from '../mocks/mock-message'
import { MockPlayer } from '../mocks/mock-player'

describe('Go Playlist', () => {
  let TestModule: TestCommandModule<typeof goplaylist>

  let player: MockPlayer

  let loggerService: jest.Mocked<LoggerService>
  let playerService: jest.Mocked<PlayerService>
  let plexService: jest.Mocked<PlexService>
  let loader: jest.Mocked<ListingLoaderService>
  let builderService: jest.Mocked<MessageBuilderService>
  let playlistService: jest.Mocked<PlaylistService>
  let queryService: jest.Mocked<PlayQueryService>

  const playlistName = 'test playlist name'
  const playlist: Playlist = {
    _id: MockObjectId(),
    guildId: '456',
    name: playlistName,
    ownerId: '789',
    listings: [
      {
        id: 'playlist-listing-1',
        source: TrackType.Local,
      },
    ],
  }

  beforeAll(async () => {
    TestModule = await TestCommandModule.init(goplaylist, [
      LoggerService,
      PlayerService,
      PlexService,
      ListingLoaderService,
      MessageBuilderService,
      PlaylistService,
      PlayQueryService,
    ])

    playerService = TestModule.ref.get(PlayerService)
    plexService = TestModule.ref.get(PlexService)
    loader = TestModule.ref.get(ListingLoaderService)
    builderService = TestModule.ref.get(MessageBuilderService)
    playlistService = TestModule.ref.get(PlaylistService)
    queryService = TestModule.ref.get(PlayQueryService)
  })

  beforeEach(async () => {
    await TestModule.reset()

    player = new MockPlayer()

    playerService.getOrCreate.mockResolvedValue(player._cast())

    TestModule.source.getString.mockReturnValue(playlistName)
  })

  it.only('should render a help message', () => {
    console.log(goplaylist.helpMessage)
  })

  describe('list', () => {
    it('should add a reply using the PlaylistService list method', async () => {
      const listResult = 'Test PlaylistService List'
      playlistService.list.mockResolvedValue(listResult)

      await TestModule.executeSubcommand('list')

      expect(playlistService.list).toHaveBeenCalledTimes(1)
      expect(MockGolemMessage.addReply).toHaveBeenCalledTimes(1)
      expect(MockGolemMessage.addReply).toHaveBeenCalledWith(listResult)
    })
  })

  describe('create', () => {
    it('should create an empty playlist', async () => {
      TestModule.source.getString.mockReturnValue(playlistName)
      playlistService.create.mockResolvedValue(playlist)

      await TestModule.executeSubcommand('create')

      expect(playlistService.create).toHaveBeenCalledTimes(1)
      expect(playlistService.create).toHaveBeenCalledWith({
        name: playlistName,
        fromQueue: false,
        userInfo: {
          userId: TestModule.message.info.userId,
          guildId: TestModule.message.info.guildId,
        },
      })
      expect(MockGolemMessage.addReply).toHaveBeenCalledWith(
        'Created playlist test playlist name with 1 listings.'
      )
    })

    it('should create a playlist from queue', async () => {
      playlistService.create.mockResolvedValue(playlist)
      TestModule.source.extendedArgs = {
        fromQueue: true,
      }

      await TestModule.executeSubcommand('create')

      expect(playlistService.create).toHaveBeenCalledTimes(1)
      expect(playlistService.create).toHaveBeenCalledWith({
        name: playlistName,
        fromQueue: true,
        userInfo: {
          userId: TestModule.message.info.userId,
          guildId: TestModule.message.info.guildId,
        },
      })
      expect(MockGolemMessage.addReply).toHaveBeenCalledWith(
        'Created playlist test playlist name with 1 listings.'
      )
    })
  })

  describe('play', () => {
    const track = Mocker.Track.Local()

    beforeEach(() => {
      playlistService.hydrate.mockResolvedValue({
        tracks: [track],
      })
    })

    it('should get or create a player on invocation', async () => {
      await TestModule.executeSubcommand('play')

      expect(playerService.getOrCreate).toHaveBeenCalledTimes(1)
    })

    it('should play the hydrated result of the playlist', async () => {
      await TestModule.executeSubcommand('play')

      expect(playlistService.hydrate).toHaveBeenCalledTimes(1)
      expect(playlistService.hydrate).toHaveBeenCalledWith({
        guildId: TestModule.message.info.guildId,
        name: playlistName,
        userId: TestModule.message.info.userId,
      })
      expect(playerService.playMany).toHaveBeenCalledWith(
        TestModule.message,
        player,
        [track]
      )
    })
  })
})
