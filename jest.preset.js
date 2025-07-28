const nxPreset = require('@nx/jest/preset').default;
const isCI = require('is-ci');

module.exports = {
  ...nxPreset,
  ci: isCI,
  passWithNoTests: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};
