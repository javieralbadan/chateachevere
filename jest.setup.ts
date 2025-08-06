import '@testing-library/jest-dom';

// Mock environment variables
process.env.LOG_CORE_CONVO = 'false';
process.env.LOG_CORE_MENU = 'false';
process.env.LOG_CORE_CART = 'false';
process.env.LOG_CORE_ORDER = 'false';

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock Firebase
jest.mock('./utils/server/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  },
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

// Mock utils
jest.mock('./utils/formatters', () => ({
  formatPrice: jest.fn((price: number) => price),
  numberToEmoji: jest.fn((num) => `${num}️⃣`),
}));

jest.mock('./utils/tenantUtils', () => ({
  isTestingOrder: jest.fn(() => true),
}));
