module.exports = {
  "testEnvironment": "node",
  "testMatch": [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/__mocks__/setup.js"
  ],
  "globals": {
    "ts-jest": {
      "babelConfig": true,
      "isolatedModules": true
    }
  },
  "collectCoverageFrom": [
    "**/*.{js,ts}",
    "!**/node_modules/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "preset": "ts-jest"
};