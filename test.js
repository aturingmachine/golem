const fs = require('fs')
const data = require('./out.put.json')

const length = data.length

const results = {
  artistCandidates: {
    artist: 0,
    albumartist: 0,
    artistsort: 0,
    albumartistsort: 0,
    artistPercent: 0,
    albumartistPercent: 0,
    artistsortPercent: 0,
    albumartistsortPercent: 0,
  },
  albumCandidates: {
    album: 0,
    albumsort: 0,
    albumPercent: 0,
    albumsortPercent: 0,
  },
  trackCandidates: {
    track: 0,
    tracksort: 0,
    trackPercent: 0,
    tracksortPercent: 0,
  },
  meta: {
    releaseyear: 0,
    releaseyearPercent: 0,
  },
}

data.forEach((datum) => {
  if (datum.artistCandidates.artist !== undefined) {
    results.artistCandidates.artist++
  }

  if (datum.artistCandidates.albumartist !== undefined) {
    results.artistCandidates.albumartist++
  }

  if (datum.artistCandidates.artistsort !== undefined) {
    results.artistCandidates.artistsort++
  }

  if (datum.artistCandidates.albumartistsort !== undefined) {
    results.artistCandidates.albumartistsort++
  }

  if (datum.albumCandidates.album !== undefined) {
    results.albumCandidates.album++
  }

  if (datum.albumCandidates.albumsort !== undefined) {
    results.albumCandidates.albumsort++
  }

  if (datum.trackCandidates.track !== undefined) {
    results.trackCandidates.track++
  }

  if (datum.trackCandidates.tracksort !== undefined) {
    results.trackCandidates.tracksort++
  }

  if (datum.meta.releaseyear !== undefined) {
    results.meta.releaseyear++
  }
})

function getPercent(val) {
  return (val / length) * 100
}

results.artistCandidates.artistPercent = getPercent(
  results.artistCandidates.artist
)
results.artistCandidates.albumartistPercent = getPercent(
  results.artistCandidates.albumartist
)
results.artistCandidates.artistsortPercent = getPercent(
  results.artistCandidates.artistsort
)
results.artistCandidates.albumartistsortPercent = getPercent(
  results.artistCandidates.albumartistsort
)
results.albumCandidates.albumPercent = getPercent(results.albumCandidates.album)
results.albumCandidates.albumsortPercent = getPercent(
  results.albumCandidates.albumsort
)
results.trackCandidates.trackPercent = getPercent(results.trackCandidates.track)
results.trackCandidates.tracksortPercent = getPercent(
  results.trackCandidates.tracksort
)
results.meta.releaseyearPercent = getPercent(results.meta.releaseyear)

fs.writeFileSync(
  'reults.json',
  JSON.stringify({ ...results, length }, undefined, 2),
  {
    encoding: 'utf-8',
  }
)
