import { LocalListing } from '../../src/listing/listing'
import { TrackAudioResourceMetadata } from '../../src/tracks'
import {
  MockDiscordJS,
  MockJoinOptions,
} from '../../test-utils/mocks/discordjs'
import { MockGolem } from '../../test-utils/mocks/golem'
import { MockLocalListing } from '../../test-utils/mocks/models/listing'
import { MockLocalTrack } from '../../test-utils/mocks/models/track'
import { MockedTrackQueue, MockTrackQueue } from '../../test-utils/mocks/queue'
// eslint-disable-next-line import/order
import {
  GolemTrackAudioResource,
  MusicPlayer,
} from '../../src/player/music-player'

describe('Music Player', () => {
  let musicPlayer: MusicPlayer
  const listing = MockLocalListing() as unknown as LocalListing

  beforeEach(() => {
    MockGolem.setPresenceIdle.mockClear()
    musicPlayer = new MusicPlayer(MockJoinOptions)
  })

  it('should create a new queue, audio player, and voice connection', () => {
    expect(MockTrackQueue).toHaveBeenCalledTimes(1)
    expect(MockDiscordJS.createAudioPlayer).toHaveBeenCalledTimes(1)
    expect(MockDiscordJS.AudioPlayer.on).toHaveBeenCalledWith(
      'stateChange',
      expect.any(Function)
    )
    expect(MockDiscordJS.AudioPlayer.on).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    )
    expect(MockDiscordJS.joinVoiceChannel).toHaveBeenCalledWith(MockJoinOptions)
    expect(MockDiscordJS.VoiceConnection.on).toHaveBeenCalledWith(
      'stateChange',
      expect.any(Function)
    )
    expect(MockDiscordJS.VoiceConnection.subscribe).toHaveBeenCalledWith(
      MockDiscordJS.AudioPlayer
    )

    expect(musicPlayer).toBeTruthy()
  })

  describe('Getters', () => {
    describe('isPlaying', () => {
      it('should return true if the audioplayer is playing', () => {
        MockDiscordJS.AudioPlayer.state.status = 'playing'

        expect(musicPlayer.isPlaying).toEqual(true)
      })

      it('should return false if the audioplayer is not playing', () => {
        MockDiscordJS.AudioPlayer.state.status = 'idle'

        expect(musicPlayer.isPlaying).toEqual(false)
      })
    })

    describe('nowPlaying', () => {
      it('should return true if the current resource exists', () => {
        setCurrentResource()

        expect(musicPlayer.nowPlaying).toBe(listing)
      })

      it('should return false if the current resource doesnt exist', () => {
        musicPlayer.currentResource = undefined

        expect(musicPlayer.nowPlaying).toBeUndefined()
      })
    })

    describe('currentTrackRemaining', () => {
      it('should return the current listing duration - the playback duration', () => {
        setCurrentResource()
        musicPlayer.currentResource!.playbackDuration = 100000

        expect(musicPlayer.currentTrackRemaining).toEqual(80)
      })
    })

    describe('stats', () => {
      it('should return the count, time and hTime', () => {
        setCurrentResource()
        musicPlayer.currentResource!.playbackDuration = 100000
        MockedTrackQueue.runTime = 200
        MockedTrackQueue.explicitQueueRunTime = 828

        expect(musicPlayer.stats).toEqual({
          count: 0,
          hTime: '04:40',
          time: 280,
          explicitTime: 908,
        })
      })
    })

    describe('trackCount', () => {
      it('should return the queued track count if nothing is playing', () => {
        MockedTrackQueue.queuedTrackCount = 10
        MockDiscordJS.AudioPlayer.state.status = 'idle'

        expect(musicPlayer.trackCount).toEqual(10)
      })

      it('should return the queued track +1 count if something is playing', () => {
        MockedTrackQueue.queuedTrackCount = 10
        MockDiscordJS.AudioPlayer.state.status = 'playing'

        expect(musicPlayer.trackCount).toEqual(11)
      })
    })

    describe('isDisconnected', () => {
      it('should return false if the voiceconnection status is not disconnected', () => {
        MockDiscordJS.VoiceConnection.state.status = 'connected'

        expect(musicPlayer.isDisconnected).toEqual(false)
      })

      it('should return true if the voiceconnection status is disconnected', () => {
        MockDiscordJS.VoiceConnection.state.status = 'disconnected'

        expect(musicPlayer.isDisconnected).toEqual(true)
      })
    })

    describe('isDestroyed', () => {
      it('should return false if the voiceconnection status is not destroyed', () => {
        MockDiscordJS.VoiceConnection.state.status = 'connected'

        expect(musicPlayer.isDestroyed).toEqual(false)
      })

      it('should return true if the voiceconnection status is destroyed', () => {
        MockDiscordJS.VoiceConnection.state.status = 'destroyed'

        expect(musicPlayer.isDestroyed).toEqual(true)
      })
    })
  })

  describe('Methods', () => {
    describe('enqueue', () => {
      it('should use addNext if enqueueAsNext is true', async () => {
        const track = new MockLocalTrack()

        await musicPlayer.enqueue(track._toTrack(), false)

        expect(MockedTrackQueue.add).toHaveBeenCalledWith(track.userId, track)
      })

      it('should use add if enqueueAsNext is false', async () => {
        const track = new MockLocalTrack()

        await musicPlayer.enqueue(track._toTrack(), true)

        expect(MockedTrackQueue.addNext).toHaveBeenCalledWith(
          track.userId,
          track
        )
      })
    })

    describe('enqueueMany', () => {
      it('should add many tracks to the queue', async () => {
        const tracks = [new MockLocalTrack('t-1'), new MockLocalTrack('t-2')]

        await musicPlayer.enqueueMany(
          'ksj',
          tracks.map((t) => t._toTrack())
        )

        expect(MockedTrackQueue.addMany).toHaveBeenCalledWith('ksj', tracks)
      })
    })

    describe('skip', () => {
      it('should call skip and process the queue', async () => {
        await musicPlayer.skip()

        expect(MockedTrackQueue.skip).toHaveBeenCalledWith(0)
      })
    })

    describe('destroy', () => {
      it('should do nothing if the voiceConnection has been destroyed', async () => {
        MockDiscordJS.VoiceConnection.state.status =
          MockDiscordJS.VoiceConnectionStatus.Destroyed

        await musicPlayer.destroy()

        expect(MockGolem.removePlayer).not.toHaveBeenCalled()
        expect(MockDiscordJS.VoiceConnection.destroy).not.toHaveBeenCalled()
      })

      it('should do nothing if the voiceConnection has been disconnected', async () => {
        MockDiscordJS.VoiceConnection.state.status =
          MockDiscordJS.VoiceConnectionStatus.Disconnected

        await musicPlayer.destroy()

        expect(MockGolem.removePlayer).not.toHaveBeenCalled()
        expect(MockDiscordJS.VoiceConnection.destroy).not.toHaveBeenCalled()
      })

      it('should remove the player and destroy the voice connection', async () => {
        MockDiscordJS.VoiceConnection.state.status =
          MockDiscordJS.VoiceConnectionStatus.Connecting

        await musicPlayer.destroy()

        expect(MockGolem.removePlayer).toHaveBeenCalledWith(
          MockJoinOptions.guildId,
          MockJoinOptions.channelId
        )
        expect(MockDiscordJS.VoiceConnection.destroy).toHaveBeenCalled()
      })
    })

    describe('pause', () => {
      it('should pause the audioPlayer', () => {
        musicPlayer.pause()

        expect(MockDiscordJS.AudioPlayer.pause).toHaveBeenCalledTimes(1)
      })
    })

    describe('unpause', () => {
      it('should unpause the audioPlayer', () => {
        musicPlayer.unpause()

        expect(MockDiscordJS.AudioPlayer.unpause).toHaveBeenCalledTimes(1)
      })
    })

    describe('stop', () => {
      it('should clear the queue and stop the audio player', () => {
        musicPlayer.stop()

        expect(MockedTrackQueue.clear).toHaveBeenCalled()
        expect(musicPlayer.currentResource).toBeUndefined()
        expect(MockDiscordJS.AudioPlayer.stop).toHaveBeenCalledWith(true)
        expect(MockGolem.setPresenceIdle).toHaveBeenCalledTimes(1)
      })
    })

    describe('shuffle', () => {
      it('should shuffle the queue', async () => {
        musicPlayer.shuffle()

        expect(MockedTrackQueue.shuffle).toHaveBeenCalledTimes(1)
      })
    })

    describe('peek', () => {
      it('should peekDeep the queue', async () => {
        musicPlayer.peek()

        expect(MockedTrackQueue.peekDeep).toHaveBeenCalledWith(5)
      })
    })

    describe('disconnect', () => {
      it('should do nothing if the voiceConnection has been destroyed', async () => {
        MockDiscordJS.VoiceConnection.state.status =
          MockDiscordJS.VoiceConnectionStatus.Destroyed

        musicPlayer.disconnect()

        expect(MockDiscordJS.VoiceConnection.disconnect).not.toHaveBeenCalled()
      })

      it('should do nothing if the voiceConnection has been disconnected', async () => {
        MockDiscordJS.VoiceConnection.state.status =
          MockDiscordJS.VoiceConnectionStatus.Destroyed

        musicPlayer.disconnect()

        expect(MockDiscordJS.VoiceConnection.disconnect).not.toHaveBeenCalled()
      })

      it('should disconnect the voice connection', async () => {
        MockDiscordJS.VoiceConnection.state.status =
          MockDiscordJS.VoiceConnectionStatus.Ready

        musicPlayer.disconnect()

        expect(MockDiscordJS.VoiceConnection.disconnect).toHaveBeenCalledTimes(
          1
        )
      })
    })
  })

  function setCurrentResource(): void {
    musicPlayer.currentResource = {
      metadata: {
        listing,
      } as unknown as TrackAudioResourceMetadata,
    } as GolemTrackAudioResource
  }
})
