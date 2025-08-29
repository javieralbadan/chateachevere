import { createCartHandlers } from '@/services/core/cart-handlers';
import { createCategoriesHandlers } from '@/services/core/categories-handlers';
import { createConversationManager } from '@/services/core/conversation';
import { createSequentialHandlers } from '@/services/core/sequential-handlers';
import {
  CategoriesFlowConfig,
  GetFinalMessageProps,
  SequentialFlowConfig,
  TenantConfig,
} from '@/types/menu';
import { tenantConfig } from './config';
import {
  getFinalMessage,
  repeatCategoriesFlowMessage,
  repeatSequentialFlowMessage,
  sequentialWelcomeMessage,
  welcomeCategoriesMessage,
} from './custom-messages';

export const hasActiveConvo = (phone: string) => manager.hasActiveConversation(phone);
export const clearConvo = (phone: string) => manager.clearConversation(phone);
const isSequentialConvo = tenantConfig.flowType === 'sequential';

// Función principal para ser usada en el webhook
export const conversationHandler = async (phoneNumber: string, message: string) => {
  try {
    const getWelcomeMsg = isSequentialConvo ? sequentialWelcomeMessage : welcomeCategoriesMessage;
    // Uso del manager, como resultado de createConversationManager
    return await manager.processMessage(phoneNumber, message, getWelcomeMsg);
  } catch (error) {
    console.error('❌ Error en conversationHandler:', error);
    // Limpiar conversación corrupta y reiniciar
    await manager.clearConversation(phoneNumber);
    return welcomeCategoriesMessage('❌ Ocurrió un error. Reiniciando...');
  }
};

// Crear el manager del tenant
const manager = createConversationManager({
  tenantId: tenantConfig.tenantId,
  flowType: tenantConfig.flowType,
  timeoutMinutes: 15,
});

// Crear handlers del flujo
if (!isSequentialConvo) {
  const categoriesHandlers = createCategoriesHandlers({
    tenantConfig: tenantConfig as CategoriesFlowConfig,
    manager,
    customMessages: {
      getWelcomeMessage: welcomeCategoriesMessage,
      getRepeatFlowMessage: repeatCategoriesFlowMessage,
    },
  });

  // Registrar handlers según el flujo
  manager.registerHandler('category_welcome', categoriesHandlers.welcome);
  manager.registerHandler('category_selection', categoriesHandlers.categorySelection);
  manager.registerHandler('item_selection', categoriesHandlers.itemSelection);
}

if (isSequentialConvo) {
  const sequentialHandlers = createSequentialHandlers({
    tenantConfig: tenantConfig as SequentialFlowConfig,
    manager,
    customMessages: {
      getWelcomeMessage: sequentialWelcomeMessage,
      getRepeatFlowMessage: repeatSequentialFlowMessage,
    },
  });

  // Registrar handlers según el flujo
  manager.registerHandler('sequential_welcome', sequentialHandlers.welcome);
  manager.registerHandler('sequential_step_selection', sequentialHandlers.stepSelection);
}

// Crear handlers del carrito (siempre en el flujo)
const cartHandlers = createCartHandlers({
  tenantConfig: tenantConfig as TenantConfig,
  manager,
  conditionalMessages: {
    sequential: {
      getWelcomeMessage: sequentialWelcomeMessage,
      getRepeatFlowMessage: repeatSequentialFlowMessage,
      getFinalMessage: (order: GetFinalMessageProps) => getFinalMessage(order),
    },
    categories: {
      getWelcomeMessage: welcomeCategoriesMessage,
      getRepeatFlowMessage: repeatCategoriesFlowMessage,
      getFinalMessage: (order: GetFinalMessageProps) => getFinalMessage(order),
    },
  },
});

// Registrar handlers del carrito
manager.registerHandler('quantity_selection', cartHandlers.quantitySelection);
manager.registerHandler('cart_actions', cartHandlers.cartActions);
