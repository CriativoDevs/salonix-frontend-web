export default {
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:8000/api/',
      },
    },
  },
};
