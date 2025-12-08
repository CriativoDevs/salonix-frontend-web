module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.cjs'],
  transform: {
    '^.+\.[jt]sx?$': 'babel-jest',
  },
};
