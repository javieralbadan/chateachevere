import type { CartConversation, ConversationManager } from '@/types/conversation';
import type { CustomMessages, TenantConfig } from '@/types/menu';
import { createCategoriesHandlers } from '../categories-handlers';

const mockPhoneNumber = '573112223344';
const mockTenantConfig: jest.Mocked<TenantConfig> = {
  tenantId: 'test-tenant',
  flowType: 'categories',
  deliveryCost: 5000,
  transfersPhoneNumber: '+1234567890',
  categories: {
    drinks: {
      name: 'Bebidas',
      emoji: '🥤',
      items: [
        { name: 'Coca Cola', price: 3000 },
        { name: 'Ginger Ale', price: 2800 },
      ],
    },
    snacks: {
      name: 'Snacks',
      emoji: '🍿',
      items: [
        { name: 'Papas', price: 2000 },
        { name: 'Nuggets', price: 3000 },
      ],
    },
  },
};

let mockManager: jest.Mocked<ConversationManager>;
let mockCustomMessages: jest.Mocked<CustomMessages>;
let mockConvoBase: jest.Mocked<CartConversation>;

describe('CategoriesHandlers', () => {
  let handlers: ReturnType<typeof createCategoriesHandlers>;

  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();

    // Reinicializar todos los mocks aqui
    mockManager = {
      getOrCreateConversation: jest.fn(),
      updateConversation: jest.fn(),
      clearConversation: jest.fn(),
      hasActiveConversation: jest.fn(),
      processMessage: jest.fn(),
      registerHandler: jest.fn(),
    };
    mockCustomMessages = {
      getWelcomeMessage: jest.fn(() => 'Welcome to our store!'),
      getRepeatFlowMessage: jest.fn(() => 'Choose a category:'),
    };
    mockConvoBase = {
      key: `test-${mockPhoneNumber}`,
      lastInteraction: Date.now(),
      step: 'category_welcome',
      cart: [],
    };

    handlers = createCategoriesHandlers({
      tenantConfig: mockTenantConfig,
      manager: mockManager,
      customMessages: mockCustomMessages,
    });
  });

  describe('welcome handler', () => {
    test('should update conversation step to category_selection and return welcome message', async () => {
      const result = await handlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: 'start',
        conversation: mockConvoBase,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'category_selection',
      });
      expect(mockCustomMessages.getWelcomeMessage).toHaveBeenCalled();
      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });
  });

  describe('categorySelection handler', () => {
    test('should return welcome message if no categories exist', async () => {
      const emptyConfig = { ...mockTenantConfig, categories: {} };
      const emptyHandlers = createCategoriesHandlers({
        tenantConfig: emptyConfig,
        manager: mockManager,
        customMessages: mockCustomMessages,
      });

      const result = await emptyHandlers.categorySelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: mockConvoBase,
      });

      expect(mockManager.updateConversation).not.toHaveBeenCalled();
      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return welcome message for invalid option and empty cart', async () => {
      mockManager.getOrCreateConversation.mockResolvedValue({ ...mockConvoBase, cart: [] });

      const result = await handlers.categorySelection({
        phoneNumber: mockPhoneNumber,
        message: '99',
        conversation: mockConvoBase,
      });

      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
      expect(mockManager.getOrCreateConversation).toHaveBeenCalledWith(
        mockPhoneNumber,
        'category_welcome',
      );
    });

    test('should return repeat flow message for invalid option and a non-empty cart', async () => {
      const convoWithCart = { ...mockConvoBase, cart: [{ name: 'Item', quantity: 1, price: 10 }] };
      mockManager.getOrCreateConversation.mockResolvedValue(convoWithCart as CartConversation);

      const result = await handlers.categorySelection({
        phoneNumber: mockPhoneNumber,
        message: '99',
        conversation: convoWithCart as CartConversation,
      });

      expect(result).toBe(mockCustomMessages.getRepeatFlowMessage());
      expect(mockManager.getOrCreateConversation).toHaveBeenCalledWith(
        mockPhoneNumber,
        'category_welcome',
      );
    });

    test('should update step to item_selection and return correct message for a valid option', async () => {
      const incommingMessage = 2; // Corresponde a 'snacks'
      const result = await handlers.categorySelection({
        phoneNumber: mockPhoneNumber,
        message: incommingMessage.toString(),
        conversation: mockConvoBase,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'item_selection',
        selectedCategory: Object.keys(mockTenantConfig.categories)[incommingMessage - 1],
      });

      // Validar el contenido del mensaje (comportamiento), no el string exacto
      const { name: expectedCategoryName } = mockTenantConfig.categories.snacks;
      const expectedItem1 = mockTenantConfig.categories.snacks.items[0];
      const expectedItem2 = mockTenantConfig.categories.snacks.items[1];

      expect(result).toContain(expectedCategoryName);
      expect(result).toContain(expectedItem1.name);
      expect(result).toContain(expectedItem1.price.toString());
      expect(result).toContain(expectedItem2.name);
      expect(result).toContain(expectedItem2.price.toString());
      expect(result).toContain('*Elige un número*');
    });
  });

  describe('itemSelection handler', () => {
    test('should return welcome message if no categories exist', async () => {
      const emptyConfig = { ...mockTenantConfig, categories: {} };
      const emptyHandlers = createCategoriesHandlers({
        tenantConfig: emptyConfig,
        manager: mockManager,
        customMessages: mockCustomMessages,
      });

      const result = await emptyHandlers.itemSelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: { ...mockConvoBase, selectedCategory: 'drinks' } as CartConversation,
      });

      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return welcome message if no category is selected', async () => {
      const result = await handlers.itemSelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: mockConvoBase,
      });

      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return welcome message if selected category is not found', async () => {
      const result = await handlers.itemSelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: { ...mockConvoBase, selectedCategory: 'non-existent' } as CartConversation,
      });

      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return error message for invalid item option', async () => {
      const conversation = { ...mockConvoBase, selectedCategory: 'snacks' };
      const result = await handlers.itemSelection({
        phoneNumber: mockPhoneNumber,
        message: '99',
        conversation: conversation as CartConversation,
      });

      const { name: expectedCategoryName } = mockTenantConfig.categories.snacks;
      const expectedItem1 = mockTenantConfig.categories.snacks.items[0];
      const expectedItem2 = mockTenantConfig.categories.snacks.items[0];

      expect(result).toContain('❌ Opción no válida');
      expect(result).toContain(expectedCategoryName);
      expect(result).toContain(expectedItem1.name);
      expect(result).toContain(expectedItem1.price.toString());
      expect(result).toContain(expectedItem2.name);
      expect(result).toContain(expectedItem2.price.toString());
      expect(result).toContain('*Elige un número*');
    });

    test('should update step to quantity_selection and return correct message for valid option', async () => {
      const incommingMessage = 2; // Corresponde a 'Ginger Ale'
      const conversation = { ...mockConvoBase, selectedCategory: 'drinks' };
      const result = await handlers.itemSelection({
        phoneNumber: mockPhoneNumber,
        message: incommingMessage.toString(),
        conversation: conversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'quantity_selection',
        selectedItem: mockTenantConfig.categories.drinks.items[incommingMessage - 1],
      });

      const expectedItem1 = mockTenantConfig.categories.drinks.items[incommingMessage - 1];

      expect(result).toContain(expectedItem1.name);
      expect(result).toContain(expectedItem1.price.toString());
      expect(result).toContain('¿Cuántas unidades deseas?');
      expect(result).toContain('*Responde con un número (1-10)*');
    });
  });
});
