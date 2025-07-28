import { handleCartActions, handleCheckout, handleQuantitySelection } from '@/services/core/cart';
import { createConversationManager } from '@/services/core/conversation';
import { handleCategorySelection, handleItemSelection } from '@/services/core/menu';
import type { CartConversation, CartItem, InitialConvo, TenantHandler } from '@/types/conversation';
import { TENANT_CONFIG, TENANT_ID, tenantCategories } from './config';
import { getAddMoreItemsMessage, getFinalMessage, getWelcomeMessage } from './custom-messages';

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
  await restaurantManager.updateConversation(phoneNumber, {
    step: 'category_selection',
  });
  return getWelcomeMessage();
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
  return handleCartActions({
    conversation,
    option: parseInt(message.trim(), 10),
    deliveryCost: TENANT_CONFIG.deliveryCost,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    updateConversationFn: (upd: Partial<CartConversation>) =>
      restaurantManager.updateConversation(phoneNumber, upd),
    welcomeMessageFn: getWelcomeMessage,
    addMoreItemsFn: getAddMoreItemsMessage,
    addMoreStep: 'category_selection',
  });
};

const handleCheckoutResponse: TenantHandler = async ({ phoneNumber, message, conversation }) => {
  console.log('🛫 handleCheckoutResponse [checkout] "CONFIRMACIÓN DE PEDIDO"');
  return handleCheckout({
    conversation,
    option: parseInt(message.trim(), 10),
    deliveryCost: TENANT_CONFIG.deliveryCost,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    updateConversationFn: (upd: Partial<CartConversation>) =>
      restaurantManager.updateConversation(phoneNumber, upd),
    welcomeMessageFn: getWelcomeMessage,
    addMoreItemsFn: getAddMoreItemsMessage,
    addMoreStep: 'category_selection',
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
