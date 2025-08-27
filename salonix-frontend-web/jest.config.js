export default {
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
};
