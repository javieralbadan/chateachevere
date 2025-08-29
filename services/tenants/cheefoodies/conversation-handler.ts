import { createCartHandlers } from '@/services/core/cart-handlers';
import { createCategoriesHandlers } from '@/services/core/categories-handlers';
import { createConversationManager } from '@/services/core/conversation';
import { CategoriesFlowConfig, GetFinalMessageProps, TenantConfig } from '@/types/menu';
import { tenantConfig } from './config';
import { getFinalMessage, getRepeatFlowMessage, getWelcomeMessage } from './custom-messages';

export const hasActiveConvo = (phone: string) => manager.hasActiveConversation(phone);
export const clearConvo = (phone: string) => manager.clearConversation(phone);

// Función principal para ser usada en el webhook
export const conversationHandler = async (phoneNumber: string, message: string) => {
  try {
    // Uso del manager, como resultado de createConversationManager
    return await manager.processMessage(phoneNumber, message, getWelcomeMessage);
  } catch (error) {
    console.error('❌ Error en conversationHandler:', error);
    // Limpiar conversación corrupta y reiniciar
    await manager.clearConversation(phoneNumber);
    return getWelcomeMessage('❌ Ocurrió un error. Reiniciando...');
  }
};

// Crear el manager del tenant
const manager = createConversationManager({
  tenantId: tenantConfig.tenantId,
  flowType: tenantConfig.flowType,
  timeoutMinutes: 15,
});
// Crear handlers del flujo
const categoriesHandlers = createCategoriesHandlers({
  tenantConfig: tenantConfig as CategoriesFlowConfig,
  manager,
  customMessages: {
    getWelcomeMessage,
    getRepeatFlowMessage,
  },
});
const cartHandlers = createCartHandlers({
  tenantConfig: tenantConfig as TenantConfig,
  manager,
  conditionalMessages: {
    categories: {
      // Evitar ejecutar la fn aqui, dado que se requeriria en pasos finales del flujo
      // getRepeatFlowMessage: () => getRepeatFlowMessage(),
      getWelcomeMessage,
      getRepeatFlowMessage,
      getFinalMessage: (order: GetFinalMessageProps) => getFinalMessage(order),
    },
  },
});
// Registrar handlers según el flujo
manager.registerHandler('category_welcome', categoriesHandlers.welcome);
manager.registerHandler('category_selection', categoriesHandlers.categorySelection);
manager.registerHandler('item_selection', categoriesHandlers.itemSelection);
// Registrar handlers del carrito
manager.registerHandler('quantity_selection', cartHandlers.quantitySelection);
manager.registerHandler('cart_actions', cartHandlers.cartActions);
