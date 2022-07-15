enum Mood {
  Sad = 'Sad',
  Party = 'Party',
  Aggressive = 'Aggressive',
  Acoustic = 'Acoustic',
  Happy = 'Happy',
  Relaxed = 'Relaxed',
  Electronic = 'Electronic',
}

type MoodCriteria = {
  title: string
  names: string[]
  minBPM: number
  maxBPM: number
  tags: Mood[]
  notTags: Mood[]
}

// {moods: {$nin: ['Sad', 'Party', 'Aggressive'], $in: ['Relaxed'] }, bpm: { $lt: 100 }}
// {moods: {$nin: [ 'Aggressive'], $in: ['Party'] }, bpm: { $gt: 140, $lt: 2000 }}
const moods: MoodCriteria[] = [
  {
    title: 'Chill',
    names: ['chill'],
    minBPM: 0,
    maxBPM: 100,
    tags: [Mood.Relaxed],
    notTags: [Mood.Sad, Mood.Party, Mood.Aggressive],
  },
]

class MoodAnalyzer {}
