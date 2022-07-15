import { TrackQueue } from '../../src/music/player/queue'
import { MockLocalTrack } from '../../test-utils/mocks/models/track'

describe('Track Queue', () => {
  const userId = 'ksj'
  let queue: TrackQueue
  let firstTrack: MockLocalTrack
  let secondTrack: MockLocalTrack

  beforeEach(() => {
    queue = new TrackQueue()
    firstTrack = new MockLocalTrack('track-1')
    secondTrack = new MockLocalTrack('track-2')

    seedQueue()
  })

  describe('addNext', () => {
    it('should add the track in front of the existing tracks', () => {
      const addedTrack = new MockLocalTrack('added-track')
      queue.addNext(userId, addedTrack._toTrack())

      const tracks = queue.peekDeep(10)

      expect(tracks).toEqual([addedTrack, firstTrack, secondTrack])
    })

    it('should add the track behind other add-nexted tracks', () => {
      const addNextedTrack = new MockLocalTrack('add-nexted-track')
      const addedTrack = new MockLocalTrack('added-track')
      queue.addNext(userId, addNextedTrack._toTrack())
      queue.addNext(userId, addedTrack._toTrack())

      const tracks = queue.peekDeep(10)

      expect(tracks).toEqual([
        addNextedTrack,
        addedTrack,
        firstTrack,
        secondTrack,
      ])
    })
  })

  describe('add', () => {
    it('should add the track to the back of the queue', () => {
      const addedTrack = new MockLocalTrack('added-track')
      queue.add(userId, addedTrack._toTrack())

      const tracks = queue.peekDeep(10)

      expect(tracks).toEqual([firstTrack, secondTrack, addedTrack])
    })
  })

  describe('addMany', () => {
    it('should add the tracks at the back of the queue', () => {
      const addedTrack = new MockLocalTrack('added-track')
      const secondAddedTrack = new MockLocalTrack('second-added-track')

      queue.addMany(userId, [
        addedTrack._toTrack(),
        secondAddedTrack._toTrack(),
      ])

      const tracks = queue.peekDeep(10)

      expect(tracks).toEqual([
        firstTrack,
        secondTrack,
        addedTrack,
        secondAddedTrack,
      ])
    })
  })

  describe('skip', () => {
    it('should skip through the explicit queue before skipping the passive queue', () => {
      const addNextedTrack = new MockLocalTrack('add-nexted-track')
      const addedTrack = new MockLocalTrack('added-track')
      queue.addNext(userId, addNextedTrack._toTrack())
      queue.addNext(userId, addedTrack._toTrack())

      queue.skip(3)

      const tracks = queue.peekDeep(10)

      expect(tracks).toEqual([secondTrack])
    })
  })

  describe('clear', () => {
    it('should empty the queue', () => {
      queue.clear()

      const tracks = queue.peekDeep(10)

      expect(tracks).toEqual([])
    })
  })

  describe('peek', () => {
    it('should return the first track from the queue', () => {
      expect(queue.peek()).toEqual(firstTrack)
    })
  })

  describe('peekDeep', () => {
    it('should return the requested number of tracks', () => {
      const addNextedTrack = new MockLocalTrack('add-nexted-track')
      const addedTrack = new MockLocalTrack('added-track')
      queue.addNext(userId, addNextedTrack._toTrack())
      queue.addNext(userId, addedTrack._toTrack())

      expect(queue.peekDeep(2)).toEqual([addNextedTrack, addedTrack])
    })
  })

  describe('pop', () => {
    it('should remove the first track and return it', () => {
      expect(queue.pop()).toEqual(firstTrack)
      expect(queue.peek()).toEqual(secondTrack)
    })
  })

  describe('shuffle', () => {
    it('should shuffle the tracks', () => {
      const thirdTrack = new MockLocalTrack('third-track')
      const fourthTrack = new MockLocalTrack('fourth-track')
      queue.add(userId, thirdTrack._toTrack())
      queue.add(userId, fourthTrack._toTrack())

      expect(queue.peekDeep(10)).toEqual([
        firstTrack,
        secondTrack,
        thirdTrack,
        fourthTrack,
      ])

      queue.shuffle()

      expect(queue.peekDeep(10)).not.toEqual([
        firstTrack,
        secondTrack,
        thirdTrack,
        fourthTrack,
      ])
    })

    it('should shuffle the tracks - keeping the explicit queue intact', () => {
      queue.clear()
      const explicit = [3, 4, 5, 6, 7, 8, 9, 0].map(
        (i) => new MockLocalTrack(`${i}-track`)
      )
      explicit.forEach((t) => queue.addNext(userId, t._toTrack()))
      const passive = [10, 11, 12, 13, 14, 15, 16, 17].map(
        (i) => new MockLocalTrack(`${i}-track`)
      )
      passive.forEach((t) => queue.add(userId, t._toTrack()))

      expect(queue.peekDeep(16)).toEqual([...explicit, ...passive])

      queue.shuffle()

      const shuffledExplicit = queue.peekDeep(16).slice(0, 8)
      const shuffledPassive = queue.peekDeep(16).slice(8)

      explicit.forEach((t) => expect(shuffledExplicit).toContainEqual(t))
      passive.forEach((t) => expect(shuffledPassive).toContainEqual(t))

      expect(shuffledExplicit).not.toEqual(explicit)
      expect(shuffledPassive).not.toEqual(passive)
    })
  })

  describe('runTime', () => {
    it('should add the duration of all queued tracks', () => {
      queue.clear()
      firstTrack.metadata.duration = 10
      secondTrack.metadata.duration = 15
      seedQueue()

      expect(queue.runTime).toEqual(25)
    })
  })

  describe('queuedTrackCount', () => {
    it('should return the length of the queue', () => {
      expect(queue.queuedTrackCount).toEqual(2)
    })
  })

  function addToQueue(...mockTracks: MockLocalTrack[]): void {
    queue.addMany(
      userId,
      mockTracks.map((t) => t._toTrack())
    )
  }

  function seedQueue(): void {
    addToQueue(firstTrack, secondTrack)
  }
})
