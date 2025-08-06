import type { CartConversation, ConversationManager } from '@/types/conversation';
import type { CustomMessages, SequentialFlowConfig } from '@/types/menu';
import { createSequentialHandlers } from '../sequential-handlers';

const mockPhoneNumber = '573112223344';

describe('SequentialHandlers', () => {
  let mockManager: jest.Mocked<ConversationManager>;
  let mockCustomMessages: jest.Mocked<CustomMessages>;
  let mockTenantConfig: SequentialFlowConfig;
  let mockConvoBase: jest.Mocked<CartConversation>;
  let handlers: ReturnType<typeof createSequentialHandlers>;

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

    mockTenantConfig = {
      tenantId: 'test-tenant',
      flowType: 'sequential',
      initialMessage: 'Here you can customize your pizza',
      footerInfo: 'Each pizza comes without extra toppings',
      deliveryCost: 3000,
      transfersPhoneNumber: '+1234567890',
      steps: [
        {
          name: 'base',
          emoji: '🍕',
          order: 1,
          items: [
            { name: 'Pizza Margherita', price: 15000 },
            { name: 'Pizza Pepperoni', price: 18000 },
          ],
        },
        {
          name: 'size',
          emoji: '📏',
          order: 2,
          items: [
            { name: 'Personal', price: 0 },
            { name: 'Medium', price: 5000 },
            { name: 'Big', price: 10000 },
          ],
        },
        {
          name: 'extras',
          emoji: '🧀',
          order: 3,
          items: [
            { name: 'No extras', price: 0 },
            { name: 'Extra cheese', price: 2000 },
            { name: 'Mushrooms', price: 3000 },
          ],
        },
      ],
    };

    mockConvoBase = {
      key: `test-${mockPhoneNumber}`,
      lastInteraction: Date.now(),
      step: 'sequential_welcome',
      cart: [],
    };

    handlers = createSequentialHandlers({
      tenantConfig: mockTenantConfig,
      manager: mockManager,
      customMessages: mockCustomMessages,
    });
  });

  describe('welcome handler', () => {
    test('should start sequential flow when option 1 is selected', async () => {
      const result = await handlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: mockConvoBase,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'sequential_step_selection',
        sequentialFlow: {
          currentStep: 1,
          selections: {},
        },
      });

      // Validar el contenido del mensaje del primer step
      const expectedStep = mockTenantConfig.steps[0];
      expect(result).toContain(expectedStep.emoji);
      expect(result).toContain(expectedStep.name);
      expect(result).toContain(expectedStep.items[0].name);
      expect(result).toContain(expectedStep.items[1].name);
      expect(result).toContain('*Elige un número*');
    });

    test('should return welcome message for invalid option with empty cart', async () => {
      mockManager.getOrCreateConversation.mockResolvedValue({ ...mockConvoBase, cart: [] });

      const result = await handlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: '2',
        conversation: mockConvoBase,
      });

      expect(mockManager.getOrCreateConversation).toHaveBeenCalledWith(
        mockPhoneNumber,
        'sequential_welcome',
      );
      expect(mockCustomMessages.getWelcomeMessage).toHaveBeenCalled();
      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return repeat flow message for invalid option with items in cart', async () => {
      const convoWithCart = {
        ...mockConvoBase,
        cart: [{ name: 'Test Item', quantity: 1, price: 1000, category: 'test' }],
      };
      mockManager.getOrCreateConversation.mockResolvedValue(convoWithCart as CartConversation);

      const result = await handlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: '0',
        conversation: convoWithCart as CartConversation,
      });

      expect(mockManager.getOrCreateConversation).toHaveBeenCalledWith(
        mockPhoneNumber,
        'sequential_welcome',
      );
      expect(mockCustomMessages.getRepeatFlowMessage).toHaveBeenCalled();
      expect(result).toBe(mockCustomMessages.getRepeatFlowMessage());
    });

    test('should handle non-numeric input gracefully', async () => {
      mockManager.getOrCreateConversation.mockResolvedValue({ ...mockConvoBase, cart: [] });

      const result = await handlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: 'invalid',
        conversation: mockConvoBase,
      });

      expect(mockCustomMessages.getWelcomeMessage).toHaveBeenCalled();
      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should handle whitespace in message input', async () => {
      await handlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: '  1  ',
        conversation: mockConvoBase,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'sequential_step_selection',
        sequentialFlow: {
          currentStep: 1,
          selections: {},
        },
      });
    });
  });

  describe('stepSelection handler', () => {
    test('should return error message when sequentialFlow is missing', async () => {
      const conversation = { ...mockConvoBase, sequentialFlow: undefined };

      const result = await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: conversation as CartConversation,
      });

      expect(mockCustomMessages.getWelcomeMessage).toHaveBeenCalledWith(
        '❌ Error en el flujo. Reiniciando...',
      );
      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return error message when current step is not found', async () => {
      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: 999, // Step que no existe
          selections: {},
        },
      };

      const result = await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: conversation as CartConversation,
      });

      expect(mockCustomMessages.getWelcomeMessage).toHaveBeenCalledWith(
        '❌ Error en el flujo. Reiniciando...',
      );
      expect(result).toBe(mockCustomMessages.getWelcomeMessage());
    });

    test('should return error message for invalid option', async () => {
      const currentStep = 1;
      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep,
          selections: {},
        },
      };

      const result = await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '99',
        conversation: conversation as CartConversation,
      });

      expect(result).toContain('❌ Opción no válida');
      expect(result).toContain(mockTenantConfig.steps[currentStep - 1].name);
    });

    test('should proceed to next step when valid option is selected', async () => {
      const firstStep = 1;
      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: firstStep,
          selections: {},
        },
      };

      const result = await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '1', // Seleccionar Pizza Margherita
        conversation: conversation as CartConversation,
      });

      // Verificar que se actualiza la conversación con el siguiente step
      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        sequentialFlow: {
          currentStep: 2, // Next step (size)
          selections: {
            base: {
              stepName: 'base',
              selectedItem: {
                name: 'Pizza Margherita',
                price: 15000,
              },
            },
          },
        },
      });

      // Verificar que muestra el siguiente step (size)
      const expectedNextIndex = 1; // From zero - steps array
      const expectedNextStep = mockTenantConfig.steps[expectedNextIndex];
      expect(result).toContain(expectedNextStep.emoji);
      expect(result).toContain(expectedNextStep.name);
      expect(result).toContain('Personal');
      expect(result).toContain('Medium');
      expect(result).toContain('Big');
    });

    test('should complete sequential flow on last step', async () => {
      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: 3, // Last step (extras)
          selections: {
            base: {
              stepName: 'base',
              selectedItem: { name: 'Pizza Margherita', price: 15000 },
            },
            size: {
              stepName: 'size',
              selectedItem: { name: 'Medium', price: 5000 },
            },
          },
        },
      };

      const result = await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '2', // Seleccionar Extra cheese
        conversation: conversation as CartConversation,
      });

      // Verificar que se actualiza para quantity_selection
      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'quantity_selection',
        sequentialFlow: {
          currentStep: 0,
          selections: {
            base: {
              stepName: 'base',
              selectedItem: { name: 'Pizza Margherita', price: 15000 },
            },
            size: {
              stepName: 'size',
              selectedItem: { name: 'Medium', price: 5000 },
            },
            extras: {
              stepName: 'extras',
              selectedItem: { name: 'Extra cheese', price: 2000 },
            },
          },
          customizedItem: {
            name: 'Pizza Margherita + Medium + Extra cheese',
            price: 22000, // 15000 + 5000 + 2000
          },
        },
      });

      // Verificar que muestra el mensaje de cantidad
      expect(result).toContain('📦 *Pizza Margherita + Medium + Extra cheese*');
      expect(result).toContain('Precio');
      expect(result).toContain('22000');
      expect(result).toContain('¿Cuántos deseas?');
      expect(result).toContain('*Responde con un número (1-10)*');
    });

    test('should handle selection with zero price items', async () => {
      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: 2, // Size step
          selections: {
            base: {
              stepName: 'base',
              selectedItem: { name: 'Pizza Pepperoni', price: 18000 },
            },
          },
        },
      };

      await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '1', // Seleccionar Personal (precio 0)
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        sequentialFlow: {
          currentStep: 3, // Next step
          selections: {
            base: {
              stepName: 'base',
              selectedItem: { name: 'Pizza Pepperoni', price: 18000 },
            },
            size: {
              stepName: 'size',
              selectedItem: { name: 'Personal', price: 0 },
            },
          },
        },
      });
    });

    test('should handle boundary option selection (last valid option)', async () => {
      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: 1,
          selections: {},
        },
      };

      await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '2', // Last valid option for base step
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        sequentialFlow: {
          currentStep: 2,
          selections: {
            base: {
              stepName: 'base',
              selectedItem: {
                name: 'Pizza Pepperoni',
                price: 18000,
              },
            },
          },
        },
      });
    });

    test('should preserve existing selections when moving to next step', async () => {
      const existingSelections = {
        base: {
          stepName: 'base',
          selectedItem: { name: 'Pizza Margherita', price: 15000 },
        },
      };

      const conversation = {
        ...mockConvoBase,
        sequentialFlow: {
          currentStep: 2,
          selections: existingSelections,
        },
      };

      await handlers.stepSelection({
        phoneNumber: mockPhoneNumber,
        message: '3', // Seleccionar Big
        conversation: conversation as CartConversation,
      });

      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        sequentialFlow: {
          currentStep: 3,
          selections: {
            ...existingSelections,
            size: {
              stepName: 'size',
              selectedItem: { name: 'Big', price: 10000 },
            },
          },
        },
      });
    });
  });

  describe('step ordering', () => {
    test('should handle steps in correct order even if config is unordered', async () => {
      // Configuración con steps desordenados
      const shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const unorderedConfig = {
        ...mockTenantConfig,
        steps: shuffleArray(mockTenantConfig.steps),
      };

      const unorderedHandlers = createSequentialHandlers({
        tenantConfig: unorderedConfig as SequentialFlowConfig,
        manager: mockManager,
        customMessages: mockCustomMessages,
      });

      const result = await unorderedHandlers.welcome({
        phoneNumber: mockPhoneNumber,
        message: '1',
        conversation: mockConvoBase,
      });

      // Debería empezar con el step de order 1 (base), no el primero del array
      const baseStepTitle = mockTenantConfig.steps[0].name;
      expect(result).toContain(baseStepTitle);
      expect(mockManager.updateConversation).toHaveBeenCalledWith(mockPhoneNumber, {
        step: 'sequential_step_selection',
        sequentialFlow: {
          currentStep: 1, // order del step 'base'
          selections: {},
        },
      });
    });
  });
});
