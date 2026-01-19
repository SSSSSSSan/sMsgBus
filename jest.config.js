/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // 支持ES模块
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};

module.exports = config;
