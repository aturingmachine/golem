/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: [
    '<rootDir>/test-utils/mock-golem.ts',
    '<rootDir>/test-utils/mock-logger.ts',
    '<rootDir>/test-utils/mock-conf.ts',
    '<rootDir>/test-utils/mock-handlers.ts',
  ],
}
