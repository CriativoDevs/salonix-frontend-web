module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.cjs'],
  transform: {
    '^.+\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    viteEnv$: '<rootDir>/src/utils/viteEnv.mock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
};
