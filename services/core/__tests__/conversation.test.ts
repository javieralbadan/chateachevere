import type { CartConversation, ConversationManager, ConvoBaseConfig } from '@/types/conversation';
import { kv } from '@vercel/kv';
import { clearLocalCache, createConversationManager } from '../conversation';

// Type assertion para acceder a los métodos mock
const mockedKv = kv as jest.Mocked<typeof kv>;
const mockPhoneNumber = '573112223344';
let mockConfig: jest.Mocked<ConvoBaseConfig>;

describe('ConversationManager', () => {
  let convoManager: ConversationManager;

  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
    clearLocalCache();

    // Reinicializar todos los mocks aqui
    mockConfig = {
      tenantId: 'test-tenant',
      timeoutMinutes: 30,
      flowType: 'sequential',
    };

    // Crear una nueva instancia del manager para cada test
    convoManager = createConversationManager(mockConfig);
  });

  describe('when creating a new conversation', () => {
    test('should create new conversation for sequential flow when none exists in cache', async () => {
      // Arrange
      const expectedKey = `${mockConfig.tenantId}-${mockPhoneNumber}`;
      const initialStep = 'sequential_welcome';

      // Mock: no existe en KV
      mockedKv.get.mockResolvedValue(null);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      const result = await convoManager.getOrCreateConversation(mockPhoneNumber, initialStep);

      // Assert
      expect(result).toMatchObject({
        key: expectedKey,
        step: initialStep,
        cart: [],
      });
      expect(result.lastInteraction).toBeCloseTo(Date.now(), -2); // Tolerancia de ~100ms
      expect(typeof result.lastInteraction).toBe('number');

      // Verificar llamadas a KV
      expect(mockedKv.get).toHaveBeenCalledWith(expectedKey);
      expect(mockedKv.set).toHaveBeenCalledWith(
        expectedKey,
        expect.objectContaining({
          key: expectedKey,
          step: initialStep,
          cart: [],
          lastInteraction: expect.any(Number) as number,
        }),
        { ex: 1800 }, // 30 minutes in seconds
      );
    });

    test('should create new conversation for categories flow when none exists', async () => {
      // Arrange
      const categoriesConfig: ConvoBaseConfig = {
        ...mockConfig,
        flowType: 'categories',
      };
      const convoManager = createConversationManager(categoriesConfig);
      const initialStep = 'category_welcome';

      mockedKv.get.mockResolvedValue(null);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      const result = await convoManager.getOrCreateConversation(mockPhoneNumber, initialStep);

      // Assert
      expect(result.step).toBe(initialStep);
      expect(result.cart).toEqual([]);
    });
  });

  describe('when conversation exists in cache', () => {
    test('should return existing conversation from KV cache', async () => {
      // Arrange
      const expectedKey = `${mockConfig.tenantId}-${mockPhoneNumber}`;
      const existingConversation = {
        key: expectedKey,
        step: 'item_selection',
        lastInteraction: Date.now() - 5000, // 5 segundos atrás
        cart: [{ id: 1, name: 'Pizza', quantity: 2, price: 15000 }],
        selectedCategory: 'main_dishes',
      };

      // Mock: existe en KV
      mockedKv.get.mockResolvedValue(JSON.parse(JSON.stringify(existingConversation)));
      mockedKv.set.mockResolvedValue('OK');

      // Act
      const result = await convoManager.getOrCreateConversation(
        mockPhoneNumber,
        'sequential_welcome',
      );

      // Assert
      expect(result).toMatchObject({
        key: expectedKey,
        step: 'item_selection', // Mantiene el step existente
        cart: existingConversation.cart,
        selectedCategory: 'main_dishes',
      });
      expect(result.lastInteraction).toBeGreaterThan(existingConversation.lastInteraction);

      // Debe actualizar el timestamp y guardar en cache
      expect(mockedKv.set).toHaveBeenCalledWith(
        expectedKey,
        expect.objectContaining({
          ...existingConversation,
          lastInteraction: expect.any(Number) as number,
        }),
        { ex: 1800 },
      );
    });

    test('should update lastInteraction timestamp for existing conversation', async () => {
      // Arrange
      const oldTimestamp = Date.now() - 10000; // 10 segundos atrás
      const existingConversation = {
        key: `${mockConfig.tenantId}-${mockPhoneNumber}`,
        step: 'cart_actions',
        lastInteraction: oldTimestamp,
        cart: [],
      };

      mockedKv.get.mockResolvedValue(existingConversation);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      const result = await convoManager.getOrCreateConversation(
        mockPhoneNumber,
        'sequential_welcome',
      );

      // Assert
      expect(result.lastInteraction).toBeGreaterThan(oldTimestamp);
      expect(result.lastInteraction).toBeCloseTo(Date.now(), -2);
    });
  });

  describe('caching behavior', () => {
    test('should save to both KV and local cache', async () => {
      // Arrange
      mockedKv.get.mockResolvedValue(null);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      await convoManager.getOrCreateConversation(mockPhoneNumber, 'sequential_welcome');

      // Assert
      expect(mockedKv.set).toHaveBeenCalledTimes(1);
      expect(mockedKv.get).toHaveBeenCalledTimes(1);
    });

    test('should handle KV errors gracefully', async () => {
      // Arrange
      mockedKv.get.mockRejectedValue(new Error('KV connection error'));

      // Act & Assert
      await expect(
        convoManager.getOrCreateConversation(mockPhoneNumber, 'sequential_welcome'),
      ).rejects.toThrow('KV connection error');
    });
  });

  describe('key generation', () => {
    test('should generate correct key format', async () => {
      // Arrange
      const customConfig: ConvoBaseConfig = {
        tenantId: 'restaurant-123',
        timeoutMinutes: 45,
        flowType: 'categories',
      };
      const customManager = createConversationManager(customConfig);
      const phoneNumber = '573001234567';
      const expectedKey = 'restaurant-123-573001234567';

      mockedKv.get.mockResolvedValue(null);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      const result = await customManager.getOrCreateConversation(phoneNumber, 'category_welcome');

      // Assert
      expect(result.key).toBe(expectedKey);
      expect(mockedKv.get).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('timeout configuration', () => {
    test('should use correct timeout values for different configurations', async () => {
      // Arrange
      const customConfig: ConvoBaseConfig = {
        tenantId: 'test',
        timeoutMinutes: 60, // 1 hora
        flowType: 'sequential',
      };
      const customManager = createConversationManager(customConfig);

      mockedKv.get.mockResolvedValue(null);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      await customManager.getOrCreateConversation(mockPhoneNumber, 'sequential_welcome');

      // Assert
      expect(mockedKv.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        { ex: 3600 }, // 60 minutes in seconds
      );
    });
  });

  describe('updateConversation', () => {
    test('should update existing conversation', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const existingConversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now(),
        step: 'category_welcome',
        cart: [],
      };

      mockedKv.get.mockResolvedValue(existingConversation);
      mockedKv.set.mockResolvedValue('OK');

      // Act
      await convoManager.updateConversation(phoneNumber, {
        step: 'category_selection',
        selectedCategory: 'drinks',
      });

      // Assert
      expect(mockedKv.set).toHaveBeenCalledWith(
        'test-tenant-+1234567890',
        expect.objectContaining({
          step: 'category_selection',
          selectedCategory: 'drinks',
        }),
        { ex: 1800 },
      );
    });

    test('should not update if conversation does not exist', async () => {
      // Arrange
      const phoneNumber = '+1234567890';

      mockedKv.get.mockResolvedValue(null);

      // Act
      await convoManager.updateConversation(phoneNumber, { step: 'category_selection' });

      // Assert
      expect(mockedKv.set).not.toHaveBeenCalled();
    });
  });

  describe('clearConversation', () => {
    test('should clear conversation from both caches', async () => {
      // Arrange
      const phoneNumber = '+1234567890';

      mockedKv.del.mockResolvedValue(1);

      // Act
      await convoManager.clearConversation(phoneNumber);

      // Assert
      expect(mockedKv.del).toHaveBeenCalledWith('test-tenant-+1234567890');
    });
  });

  describe('hasActiveConversation', () => {
    test('should return true for active conversation', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const conversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now(),
        step: 'category_selection',
        cart: [],
      };

      mockedKv.get.mockResolvedValue(conversation);

      // Act
      const isActive = await convoManager.hasActiveConversation(phoneNumber);

      // Assert
      expect(isActive).toBe(true);
    });

    test('should return false for expired conversation', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const conversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now() - 31 * 60 * 1000, // 31 minutes ago
        step: 'category_selection',
        cart: [],
      };

      mockedKv.get.mockResolvedValue(conversation);
      mockedKv.del.mockResolvedValue(1);

      // Act
      const isActive = await convoManager.hasActiveConversation(phoneNumber);

      // Assert
      expect(isActive).toBe(false);
      expect(mockedKv.del).toHaveBeenCalledWith('test-tenant-+1234567890');
    });

    test('should return false when no conversation exists', async () => {
      // Arrange
      const phoneNumber = '+1234567890';

      mockedKv.get.mockResolvedValue(null);

      // Act
      const isActive = await convoManager.hasActiveConversation(phoneNumber);

      // Assert
      expect(isActive).toEqual(false);
    });
  });

  describe('processMessage', () => {
    test('should call appropriate handler for conversation step', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Hello';
      const getWelcomeMessage = jest.fn(() => 'Welcome!');
      const mockHandler = jest.fn(() => Promise.resolve('Handler response'));

      const conversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now(),
        step: 'category_selection',
        cart: [],
      };

      mockedKv.get.mockResolvedValue(conversation);
      convoManager.registerHandler('category_selection', mockHandler);

      // Act
      const response = await convoManager.processMessage(phoneNumber, message, getWelcomeMessage);

      expect(mockHandler).toHaveBeenCalledWith({
        phoneNumber,
        message,
        conversation,
      });

      // Assert
      expect(response).toBe('Handler response');
    });

    test('should return welcome message when handler does not exist', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Hello';
      const getWelcomeMessage = jest.fn(() => 'Welcome!');

      const conversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now(),
        step: 'category_welcome',
        cart: [],
      };

      mockedKv.get.mockResolvedValue(conversation);
      mockedKv.del.mockResolvedValue(1);

      // Act
      const response = await convoManager.processMessage(phoneNumber, message, getWelcomeMessage);

      // Assert
      expect(getWelcomeMessage).toHaveBeenCalled();
      expect(response).toBe('Welcome!');
      expect(mockedKv.del).toHaveBeenCalled();
    });

    test('should return welcome message for inactive conversation', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Hello';
      const getWelcomeMessage = jest.fn(() => 'Welcome!');

      const conversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now() - 31 * 60 * 1000, // Expired
        step: 'category_selection',
        cart: [],
      };

      mockedKv.get.mockResolvedValue(conversation);
      mockedKv.del.mockResolvedValue(1);

      // Act
      const response = await convoManager.processMessage(phoneNumber, message, getWelcomeMessage);

      // Assert
      expect(getWelcomeMessage).toHaveBeenCalled();
      expect(response).toBe('Welcome!');
    });
  });

  describe('registerHandler', () => {
    test('should register step handler', () => {
      // Arrange
      const mockHandler = jest.fn();

      // Act
      convoManager.registerHandler('test_step', mockHandler);

      // Assert
      // We can't directly test the internal stepHandlers object,
      // but we can test that it works through processMessage
      expect(() => convoManager.registerHandler('test_step', mockHandler)).not.toThrow();
    });
  });

  describe('local cache', () => {
    test('should use local cache when available and not expired', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const conversation: CartConversation = {
        key: 'test-tenant-+1234567890',
        lastInteraction: Date.now(),
        step: 'category_selection',
        cart: [],
      };

      // Act
      // First call should hit KV
      mockedKv.get.mockResolvedValueOnce(conversation);
      await convoManager.getOrCreateConversation(phoneNumber, 'category_welcome');

      // Second call should hit local cache
      mockedKv.get.mockClear();
      await convoManager.getOrCreateConversation(phoneNumber, 'category_welcome');

      // Assert
      expect(mockedKv.get).not.toHaveBeenCalled();
    });
  });
});
