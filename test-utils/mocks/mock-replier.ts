export const MockReplier = {
  affirmative: 'affirmative',
  neutral: 'neutral',
  negative: 'negative',
}

jest.mock('../../src/utils/replies', () => ({
  Replier: MockReplier,
}))
