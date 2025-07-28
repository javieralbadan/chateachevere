import { handleCartActions, handleCheckout, handleQuantitySelection } from '@/services/core/cart';
import { createConversationManager } from '@/services/core/conversation';
import { handleCategorySelection, handleItemSelection } from '@/services/core/menu';
import { createSequentialHandlers } from '@/services/core/menu-sequential-handlers';
import type {
  AddMoreItemsStep,
  CartConversation,
  CartItem,
  InitialConvo,
  TenantHandler,
} from '@/types/conversation';
import { isSequentialFlow } from '@/utils/tenantUtils';
import { TENANT_CONFIG, TENANT_ID, tenantCategories } from './config';
import {
  getAddMoreItemsMessage,
  getFinalMessage,
  getSequentialAddMoreItemsMessage,
  getSequentialWelcomeMessage,
  getWelcomeMessage,
} from './custom-messages';

const logModule = true;

export const hasActiveConvo = (phone: string) => restaurantManager.hasActiveConversation(phone);
export const clearConvo = (phone: string) => restaurantManager.clearConversation(phone);

// Función principal para ser usada en el webhook
export const conversationHandler = async (phoneNumber: string, message: string) => {
  try {
    return await restaurantManager.processMessage(
      phoneNumber,
      message,
      getInitialConversation,
      getWelcomeMessage,
    );
  } catch (error) {
    console.error('❌ Error en conversationHandler:', error);
    // Limpiar conversación corrupta y reiniciar
    await restaurantManager.clearConversation(phoneNumber);
    return getWelcomeMessage('❌ Ocurrió un error. Reiniciando...');
  }
};
// Función para obtener conversación inicial del tenant
const getInitialConversation = (): InitialConvo<CartConversation> => ({
  step: 'welcome',
  cart: [],
});

const handleWelcomeResponse: TenantHandler = async ({ phoneNumber }) => {
  if (logModule) console.log('isSequentialFlow(TENANT_CONFIG)', isSequentialFlow(TENANT_CONFIG));
  if (isSequentialFlow(TENANT_CONFIG)) {
    if (logModule) console.log('🗂️ Manejo de bienvenida Flujo secuencial');
    await restaurantManager.updateConversation(phoneNumber, {
      step: 'sequential_welcome',
    });
    return getSequentialWelcomeMessage();
  } else {
    if (logModule) console.log('🗂️ Manejo de bienvenida Flujo por categorías');
    await restaurantManager.updateConversation(phoneNumber, {
      step: 'category_selection',
    });
    return getWelcomeMessage();
  }
};

const handleCategorySelectionResponse: TenantHandler = async ({ phoneNumber, message }) => {
  console.log('🗃️ handleCategorySelectionResponse [category_selection]');
  return handleCategorySelection({
    message,
    categories: tenantCategories,
    welcomeMessageFn: getWelcomeMessage,
    updateConversationFn: (selectedCategory: string) =>
      restaurantManager.updateConversation(phoneNumber, {
        step: 'item_selection',
        selectedCategory,
      }),
  });
};

const handleItemSelectionResponse: TenantHandler = async ({
  phoneNumber,
  message,
  conversation,
}) => {
  console.log('🪧 handleItemSelectionResponse [item_selection]');
  return handleItemSelection({
    message,
    category: tenantCategories[conversation.selectedCategory!],
    welcomeMessageFn: getWelcomeMessage,
    updateConversationFn: (opt, item) =>
      restaurantManager.updateConversation(phoneNumber, {
        step: 'quantity_selection',
        selectedItem: item.name,
        selectedItemIndex: opt - 1,
      }),
  });
};

const handleQuantitySelectionResponse: TenantHandler = async ({ phoneNumber, message }) => {
  console.log('🧮 handleQuantitySelectionResponse [quantity_selection]');
  const conversation = await restaurantManager.getOrCreateConversation(
    phoneNumber,
    getInitialConversation(),
  );
  const currentCategory = tenantCategories[conversation.selectedCategory!];
  const menuItem = currentCategory.items[conversation.selectedItemIndex!];

  return handleQuantitySelection({
    conversation,
    quantity: parseInt(message.trim(), 10),
    price: menuItem.price,
    deliveryCost: TENANT_CONFIG.deliveryCost,
    updateConversationFn: (updatedCart) =>
      restaurantManager.updateConversation(phoneNumber, {
        step: 'cart_actions',
        cart: updatedCart,
      }),
  });
};

const handleCartActionsResponse: TenantHandler = async ({ phoneNumber, message, conversation }) => {
  console.log('📮 handleCartActionsResponse [cart_actions] "TU CARRITO"');
  const { addMoreItemsFn, addMoreStep } = getAddMoreItemsFnAndMssg();
  return handleCartActions({
    conversation,
    option: parseInt(message.trim(), 10),
    deliveryCost: TENANT_CONFIG.deliveryCost,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    updateConversationFn: (upd: Partial<CartConversation>) =>
      restaurantManager.updateConversation(phoneNumber, upd),
    welcomeMessageFn: getWelcomeMessage,
    addMoreItemsFn,
    addMoreStep,
  });
};

const handleCheckoutResponse: TenantHandler = async ({ phoneNumber, message, conversation }) => {
  console.log('🛫 handleCheckoutResponse [checkout] "CONFIRMACIÓN DE PEDIDO"');
  const { addMoreItemsFn, addMoreStep } = getAddMoreItemsFnAndMssg();
  return handleCheckout({
    conversation,
    option: parseInt(message.trim(), 10),
    deliveryCost: TENANT_CONFIG.deliveryCost,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    updateConversationFn: (upd: Partial<CartConversation>) =>
      restaurantManager.updateConversation(phoneNumber, upd),
    welcomeMessageFn: getWelcomeMessage,
    addMoreItemsFn,
    addMoreStep,
    finalMessageFn: () => handleFinishConvo(phoneNumber, conversation.cart),
  });
};

const handleFinishConvo = async (phoneNumber: string, cart: CartItem[]): Promise<string> => {
  const finalMessage = await getFinalMessage(phoneNumber, cart);
  await restaurantManager.clearConversation(phoneNumber);
  return finalMessage;
};

// Crear el manager del tenant
const restaurantManager = createConversationManager<CartConversation>({
  config: {
    tenantId: TENANT_ID,
    timeoutMinutes: 15,
  },
  stepHandlers: {
    welcome: handleWelcomeResponse,
    category_selection: handleCategorySelectionResponse,
    item_selection: handleItemSelectionResponse,
    quantity_selection: handleQuantitySelectionResponse,
    cart_actions: handleCartActionsResponse,
    checkout: handleCheckoutResponse,
  },
});

const sequentialHandlers = createSequentialHandlers({
  tenantConfig: TENANT_CONFIG,
  manager: restaurantManager,
  getInitialConversation,
  customMessages: {
    getSequentialWelcomeMessage,
    getSequentialAddMoreItemsMessage,
    getWelcomeMessage,
    getAddMoreItemsMessage,
  },
});
restaurantManager.registerStepHandler(
  'sequential_welcome',
  sequentialHandlers.handleSequentialWelcomeResponse,
);
restaurantManager.registerStepHandler(
  'sequential_step_selection',
  sequentialHandlers.handleSequentialStepSelectionResponse,
);
restaurantManager.registerStepHandler(
  'sequential_quantity_selection',
  sequentialHandlers.handleSequentialQuantitySelectionResponse,
);

const getAddMoreItemsFnAndMssg = (): {
  addMoreItemsFn: () => string;
  addMoreStep: AddMoreItemsStep;
} => {
  // Determinar función de agregar más items según el tipo de flujo
  const addMoreItemsFn = isSequentialFlow(TENANT_CONFIG)
    ? getSequentialAddMoreItemsMessage
    : getAddMoreItemsMessage;

  // Determinar step de destino para "agregar más productos"
  const addMoreStep = isSequentialFlow(TENANT_CONFIG) ? 'sequential_welcome' : 'category_selection';

  return { addMoreItemsFn, addMoreStep };
};
