import { handleCartActions, handleCheckout, handleQuantitySelection } from '@/services/core/cart';
import { createConversationManager } from '@/services/core/conversation';
import { handleCategorySelection, handleItemSelection } from '@/services/core/menu';
import { createOrder, storeOrderInDB } from '@/services/core/order';
import type {
  CartConversation,
  CartItem,
  GetWelcomeMessageFn,
  InitialConvo,
  StepProps,
  TenantHandler,
  TenantInfo,
} from '@/services/core/types';
import { Category, TENANT_CONFIG } from './config';

let categoriesListString = '';
Object.keys(TENANT_CONFIG.categories).forEach((key, index) => {
  const category = TENANT_CONFIG.categories[key];
  categoriesListString += `${index + 1}️⃣ ${category.name.split(' ')[0]}\n`;
});

// Función principal para ser usada en el webhook
export const conversationHandler = async (phoneNumber: string, message: string) => {
  try {
    return await restaurantManager.processMessage(
      phoneNumber,
      message,
      getInitialRestaurantConversation,
      getWelcomeMessage,
    );
  } catch (error) {
    console.error('❌ Error en conversationHandler:', error);
    // Limpiar conversación corrupta y reiniciar
    await restaurantManager.clearConversation(phoneNumber);
    return getWelcomeMessage('❌ Ocurrió un error. Reiniciando...');
  }
};

// Mensaje de bienvenida
const getWelcomeMessage: GetWelcomeMessageFn = (msgPreliminar = '') => {
  console.log('👋🏼 getWelcomeMessage');
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  // prettier-ignore
  message += '🍽️ Bienvenido a CheFoodie\'s, ¿qué deseas pedir?\n\n';
  message += categoriesListString;
  message += '\n*Elige un número*';
  return message;
};

// Mensaje al seleccionar agregar más items
const getAddMoreItemsMessage = () => {
  console.log('👋🏼 getAddMoreItemsMessage');
  let message = '¿Qué deseas añadir a tu pedido?\n\n';
  message += categoriesListString;
  message += '\n*Elige un número*';
  return message;
};

// Manejar respuesta de bienvenida
async function handleWelcomeResponse({
  phoneNumber,
}: StepProps<CartConversation>): Promise<string> {
  await restaurantManager.updateConversation(phoneNumber, {
    step: 'category_selection',
  });
  return getWelcomeMessage();
}

// Manejar respuesta de selección de categoria
const handleCategorySelectionResponse: TenantHandler = async ({ phoneNumber, message }) => {
  console.log('🗃️ handleCategorySelectionResponse [category_selection]');
  return handleCategorySelection({
    message,
    categories: TENANT_CONFIG.categories,
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
    category: TENANT_CONFIG.categories[conversation.selectedCategory!],
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
    getInitialRestaurantConversation(),
  );
  const cat = TENANT_CONFIG.categories[conversation.selectedCategory as Category];
  const menuItem = cat.items[conversation.selectedItemIndex!];

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
    finalMessageFn: () => getFinalMessage(phoneNumber, conversation.cart),
  });
};

// Mensaje final
const getFinalMessage = async (phoneNumber: string, cart: CartItem[]): Promise<string> => {
  console.log('🏁 getFinalMessage');
  const tenantInfo: TenantInfo = {
    name: 'cheefoodies',
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    deliveryCost: TENANT_CONFIG.deliveryCost,
  };
  const orderData = createOrder({ tenantInfo, phoneNumber, cart });
  const orderId = await storeOrderInDB(orderData);
  console.log('🚀 ~ getFinalMessage ~ orderId, orderData:', orderId, orderData);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatea-chevere.vercel.app';
  const shortUrl = `${baseUrl}/api/pedido/${orderId}`;

  let message = '*FINALIZACIÓN DE PEDIDO*\n\n';
  message += `📝 *Número de pedido:* #${orderData.orderNumber}\n`;
  message += `💰 *Total:* ${orderData.total}\n`;
  message += '⏱️ *Tiempo estimado:* 30-45 minutos\n\n';

  message += '▶️▶️ *CONFIRMAR PEDIDO* ◀️◀️\n';
  message +=
    'Para finalizar tu pedido y enviar el comprobante de pago, haz clic en este enlace:\n\n';
  message += `${shortUrl}\n\n`;

  message += '📋 *Recuerda incluir:*\n';
  message += '• Comprobante de pago\n';
  message += '• Dirección completa\n';
  message += '• Nombre y teléfono de contacto\n\n';
  // prettier-ignore
  message += '¡Gracias por elegir CheFoodie\'s!\n\n';

  await restaurantManager.clearConversation(phoneNumber);

  return message;
};

// Funciones útiles para UI Test
export const UIClearConversation = (phone: string) => restaurantManager.clearConversation(phone);
export const hasActiveConvo = (phone: string) => restaurantManager.hasActiveConversation(phone);

// Función para obtener conversación inicial del restaurante
const getInitialRestaurantConversation = (): InitialConvo<CartConversation> => ({
  step: 'welcome',
  cart: [],
});

// Crear el manager del restaurante
const restaurantManager = createConversationManager<CartConversation>({
  config: { timeoutMinutes: 15 },
  stepHandlers: {
    welcome: handleWelcomeResponse,
    category_selection: handleCategorySelectionResponse,
    item_selection: handleItemSelectionResponse,
    quantity_selection: handleQuantitySelectionResponse,
    cart_actions: handleCartActionsResponse,
    checkout: handleCheckoutResponse,
  },
});
