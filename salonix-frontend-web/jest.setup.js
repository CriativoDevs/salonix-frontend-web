import { TextDecoder, TextEncoder } from 'util';

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

// Set NODE_ENV for test environment
globalThis.process = globalThis.process || {};
globalThis.process.env = globalThis.process.env || {};
globalThis.process.env.NODE_ENV = 'test';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {}, // deprecated
      removeListener: function() {}, // deprecated
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {},
    };
  },
});
