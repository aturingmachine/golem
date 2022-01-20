import { MockBugReport } from './models/bug-report'

jest.mock('../../src/db/bug-report', () => ({
  BugReport: MockBugReport,
}))
