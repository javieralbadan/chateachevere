import type { CartConversation, ConversationManager } from '@/types/conversation';
import type { ConditionalMessages, TenantConfig } from '@/types/menu';
import { createCartHandlers } from '../cart-handlers';
import { createOrder, storeOrderInDB } from '../order';

// Mock the order module
jest.mock('../order', () => ({
  createOrder: jest.fn(),
  storeOrderInDB: jest.fn(),
}));

const mockedCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>;
const mockedStoreOrderInDB = storeOrderInDB as jest.MockedFunction<typeof storeOrderInDB>;

const mockPhoneNumber = '573112223344';

describe('CartHandlers', () => {
  let mockManager: jest.Mocked<ConversationManager>;
  let mockConditionalMessages: jest.Mocked<ConditionalMessages>;
  let mockTenantConfig: TenantConfig;
  let mockConvoBase: jest.Mocked<CartConversation>;
  let handlers: ReturnType<typeof createCartHandlers>;

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

    mockConditionalMessages = {
      categories: {
        getWelcomeMessage: jest.fn(() => 'Welcome to categories!'),
        getRepeatFlowMessage: jest.fn(() => 'Choose a category:'),
        getFinalMessage: jest.fn(() => 'Order confirmed!'),
      },
      sequential: {
        getWelcomeMessage: jest.fn(() => 'Welcome to sequential!'),
        getRepeatFlowMessage: jest.fn(() => 'Start sequential process:'),
        getFinalMessage: jest.fn(() => 'Order confirmed!'),
      },
    };

    mockTenantConfig = {
      tenantId: 'test-tenant',
      flowType: 'categories',
      deliveryCost: 5000,
      transfersPhoneNumber: '+1234567890',
      categories: {
        drinks: {
          name: 'Bebidas',
          emoji: '🥤',
          items: [{ name: 'Coca Cola', price: 3000 }],
        },
      },
    };

    mockConvoBase = {
      key: `test-${mockPhoneNumber}`,
      lastInteraction: Date.now(),
      step: 'quantity_selection',
      cart: [],
    };

    handlers = createCartHandlers({
      tenantConfig: mockTenantConfig,
      manager: mockManager,
      conditionalMessages: mockConditionalMessages,
    });
  });

  describe('quantitySelection handler', () => {
    test('should add item to cart with valid quantity for categories flow', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      const result = await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'cart_actions',
        cart: [
          {
            name: 'Coca Cola',
            quantity: 2,
            price: 3000,
            category: 'drinks',
          },
        ],
        selectedCategory: undefined,
        selectedItem: undefined,
        sequentialFlow: undefined,
      });

      expect(result).toContain('🛒 *TU CARRITO*');
      expect(result).toContain('Coca Cola');
      expect(result).toContain('2 x 3000 = 6000');
      expect(result).toContain('*Total: 16000*'); // 6000 + (5000 * 2)
    });

    test('should add customized item to cart for sequential flow', async () => {
      const sequentialConfig = { ...mockTenantConfig, flowType: 'sequential' as const };
      const sequentialHandlers = createCartHandlers({
        tenantConfig: sequentialConfig,
        manager: mockManager,
        conditionalMessages: mockConditionalMessages,
      });

      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: 0,
          selections: {},
          customizedItem: { name: 'Pizza Margherita + Mediana', price: 20000 },
        },
      };

      const result = await sequentialHandlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'cart_actions',
        cart: [
          {
            name: 'Pizza Margherita + Mediana',
            quantity: 1,
            price: 20000,
            category: 'customized_item',
          },
        ],
        selectedCategory: undefined,
        selectedItem: undefined,
        sequentialFlow: undefined,
      });

      expect(result).toContain('Pizza Margherita + Mediana');
      expect(result).toContain('1 x 20000 = 20000');
    });

    test('should return error for invalid quantity (less than 1)', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      const result = await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '0',
        conversation: conversation as CartConversation,
      });

      expect(result).toBe('❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.');
      expect(mockManager.updateConversation).not.toHaveBeenCalled();
    });

    test('should return error for invalid quantity (greater than 10)', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      const result = await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '11',
        conversation: conversation as CartConversation,
      });

      expect(result).toBe('❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.');
      expect(mockManager.updateConversation).not.toHaveBeenCalled();
    });

    // TODO: Fix this logic in code base
    test('should return error for non-numeric quantity', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      const result = await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: 'invalid',
        conversation: conversation as CartConversation,
      });

      expect(result).toBe('❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.');
    });

    test('should return welcome message when no valid item to add', async () => {
      const conversation = {
        ...mockConvoBase,
        // No selectedItem ni sequentialFlow
      };

      const result = await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as CartConversation,
      });

      expect(mockConditionalMessages.categories?.getWelcomeMessage).toHaveBeenCalledWith(
        '❌ No hay item seleccionado.',
      );
      expect(result).toBe('Welcome to categories!');
    });

    test('should return error when selectedItem has incomplete data', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: '', price: undefined }, // Incomplete data
      };

      await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as unknown as CartConversation,
      });

      expect(mockConditionalMessages.categories?.getWelcomeMessage).toHaveBeenCalledWith(
        '❌ Datos del item incompletos.',
      );
    });

    test('should handle whitespace in quantity message', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '  3  ',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'cart_actions',
        cart: [
          {
            name: 'Coca Cola',
            quantity: 3,
            price: 3000,
            category: 'drinks',
          },
        ],
        selectedCategory: undefined,
        selectedItem: undefined,
        sequentialFlow: undefined,
      });
    });
  });

  describe('cartActions handler', () => {
    const mockCartWithItems = [
      { name: 'Coca Cola', quantity: 2, price: 3000, category: 'drinks' },
      { name: 'Pizza', quantity: 1, price: 15000, category: 'food' },
    ];

    test('should handle option 1 - add more products for categories flow', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.cartActions({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'category_selection',
      });
      expect(mockConditionalMessages.categories?.getRepeatFlowMessage).toHaveBeenCalled();
      expect(result).toBe('Choose a category:');
    });

    test('should handle option 1 - add more products for sequential flow', async () => {
      const sequentialConfig = { ...mockTenantConfig, flowType: 'sequential' as const };
      const sequentialHandlers = createCartHandlers({
        tenantConfig: sequentialConfig,
        manager: mockManager,
        conditionalMessages: mockConditionalMessages,
      });

      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await sequentialHandlers.cartActions({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'sequential_welcome',
      });
      expect(mockConditionalMessages.sequential?.getRepeatFlowMessage).toHaveBeenCalled();
      expect(result).toBe('Start sequential process:');
    });

    test('should handle option 2 - proceed to checkout', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.cartActions({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'checkout',
      });
      expect(result).toContain('📋 *CONFIRMACIÓN DE PEDIDO*');
      expect(result).toContain('Coca Cola');
      expect(result).toContain('Pizza');
      expect(result).toContain('💸 *Realiza transferencia al Nequi +1234567890*');
    });

    test('should return error when trying to checkout with empty cart', async () => {
      const conversation = { ...mockConvoBase, cart: [] };

      const result = await handlers.cartActions({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as CartConversation,
      });

      expect(mockConditionalMessages.categories?.getWelcomeMessage).toHaveBeenCalledWith(
        '❌ Tu carrito está vacío!',
      );
      expect(result).toBe('Welcome to categories!');
    });

    test('should handle option 3 - clear cart', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.cartActions({
        phoneNumber: mockPhoneNumber,
        message: '3',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        cart: [],
        step: 'category_selection',
      });
      expect(mockConditionalMessages.categories?.getWelcomeMessage).toHaveBeenCalledWith(
        '🗑️ Carrito vaciado!',
      );
      expect(result).toBe('Welcome to categories!');
    });

    test('should return error for invalid option', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.cartActions({
        phoneNumber: mockPhoneNumber,
        message: '4',
        conversation: conversation as CartConversation,
      });

      expect(result).toContain('❌ Opción no válida');
      expect(result).toContain('🛒 *TU CARRITO*');
      expect(result).toContain('Coca Cola');
      expect(result).toContain('Pizza');
    });
  });

  describe('checkout handler', () => {
    const mockCartWithItems = [{ name: 'Coca Cola', quantity: 2, price: 3000, category: 'drinks' }];
    const mockOrderData = {
      id: 'order123',
      orderNumber: 'ORD-001',
      total: 11000,
    };

    beforeEach(() => {
      mockedCreateOrder.mockReturnValue(mockOrderData as any);
      mockedStoreOrderInDB.mockResolvedValue('order123');
    });

    test('should handle option 1 - confirm payment', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.checkout({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'final',
      });
      expect(mockedCreateOrder).toHaveBeenCalledWith({
        tenantInfo: {
          name: 'test-tenant',
          transfersPhoneNumber: '+1234567890',
          deliveryCost: 5000,
        },
        phoneNumber: mockPhoneNumber,
        cart: mockCartWithItems,
      });
      expect(mockedStoreOrderInDB).toHaveBeenCalledWith(mockOrderData);
      expect(mockManager.clearConversation).toHaveBeenCalledWith(mockPhoneNumber);
      expect(mockConditionalMessages.categories?.getFinalMessage).toHaveBeenCalledWith({
        orderId: 'order123',
        orderData: mockOrderData,
      });
      expect(result).toBe('Order confirmed!');
    });

    test('should handle option 2 - add more products', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.checkout({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'category_selection',
      });
      expect(mockConditionalMessages.categories?.getRepeatFlowMessage).toHaveBeenCalled();
      expect(result).toBe('Choose a category:');
    });

    test('should handle option 3 - cancel order', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.checkout({
        phoneNumber: mockPhoneNumber,
        message: '3',
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        cart: [],
        step: 'category_selection',
      });
      expect(mockConditionalMessages.categories?.getWelcomeMessage).toHaveBeenCalledWith(
        '❌ Pedido cancelado!',
      );
      expect(result).toBe('Welcome to categories!');
    });

    test('should return error for invalid option', async () => {
      const conversation = { ...mockConvoBase, cart: mockCartWithItems };

      const result = await handlers.checkout({
        phoneNumber: mockPhoneNumber,
        message: '4',
        conversation: conversation as CartConversation,
      });

      expect(result).toContain('❌ Opción no válida');
      expect(result).toContain('📋 *CONFIRMACIÓN DE PEDIDO*');
      expect(result).toContain('Coca Cola');
    });
  });

  describe('delivery cost calculation', () => {
    test('should calculate delivery cost correctly for multiple items', async () => {
      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      const result = await handlers.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '3', // 3 items
        conversation: conversation as CartConversation,
      });

      // Subtotal: 3 * 3000 = 9000
      // Delivery: 3 * 5000 = 15000
      // Total: 24000
      expect(result).toContain('Subtotal: 9000');
      expect(result).toContain('Domicilio: 15000');
      expect(result).toContain('*Total: 24000*');
    });

    test('should handle zero delivery cost', async () => {
      const configWithoutDelivery = { ...mockTenantConfig, deliveryCost: 0 };
      const handlersWithoutDelivery = createCartHandlers({
        tenantConfig: configWithoutDelivery,
        manager: mockManager,
        conditionalMessages: mockConditionalMessages,
      });

      const conversation = {
        ...mockConvoBase,
        selectedCategory: 'drinks',
        selectedItem: { name: 'Coca Cola', price: 3000 },
      };

      const result = await handlersWithoutDelivery.quantitySelection({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: conversation as CartConversation,
      });

      expect(result).not.toContain('Subtotal:');
      expect(result).not.toContain('Domicilio:');
      expect(result).toContain('*Total: 6000*'); // Only item cost, no delivery
    });
  });
});
