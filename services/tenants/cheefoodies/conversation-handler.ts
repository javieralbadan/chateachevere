import {
  CartItem,
  handleCartActions,
  handleCheckout,
  handleQuantitySelection,
} from '@/services/core/cart';
import { BaseConversation, createConversationManager } from '@/services/core/conversation';
import { handleCategorySelection, handleItemSelection } from '@/services/core/menu';
import { createOrder, storeOrderInDB, TenantInfo } from '@/services/core/order';
import { Category, TENANT_CONFIG } from './config';

export interface RestaurantConversation extends BaseConversation {
  cart: CartItem[];
  selectedCategory?: string;
  selectedItem?: string;
  selectedItemIndex?: number;
}

// Función para obtener conversación inicial del restaurante
const getInitialRestaurantConversation = (): Omit<
  RestaurantConversation,
  'phoneNumber' | 'lastInteraction'
> => ({
  step: 'welcome',
  cart: [],
});

// Crear el manager del restaurante
const restaurantManager = createConversationManager<RestaurantConversation>({
  config: { timeoutMinutes: 7200 },
  stepHandlers: {
    welcome: handleWelcomeResponse,
    category_selection: handleCategorySelectionResponse,
    item_selection: handleItemSelectionResponse,
    quantity_selection: handleQuantitySelectionResponse,
    cart_actions: handleCartActionsResponse,
    checkout: handleCheckoutResponse,
  },
});

export type GetWelcomeMessageFn = (msgPreliminar?: string, greeting?: boolean) => string;

// Mensaje de bienvenida
const getWelcomeMessage: GetWelcomeMessageFn = (msgPreliminar = '', greeting = true) => {
  console.log('👋🏼 getWelcomeMessage');
  const categories = Object.keys(TENANT_CONFIG.categories);
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';

  if (greeting) {
    // prettier-ignore
    message += '🍽️ Bienvenido a CheFoodie\'s, ¿qué deseas pedir?\n\n';
  }

  categories.forEach((key, index) => {
    const category = TENANT_CONFIG.categories[key];
    message += `${index + 1}️⃣ ${category.name.split(' ')[0]}\n`;
  });

  message += '\n*Elige un número*';
  return message;
};

// Manejar respuesta de bienvenida
async function handleWelcomeResponse(phoneNumber: string): Promise<string> {
  await restaurantManager.updateConversation(phoneNumber, {
    step: 'category_selection',
  });
  return getWelcomeMessage();
}

// Manejar respuesta de selección de categoria
async function handleCategorySelectionResponse(
  phoneNumber: string,
  message: string,
): Promise<string> {
  console.log('🗃️ handleCategorySelectionResponse');
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
}

async function handleItemSelectionResponse(
  phoneNumber: string,
  message: string,
  conversation: RestaurantConversation,
): Promise<string> {
  console.log('🪧 handleItemSelectionResponse');
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
}

async function handleQuantitySelectionResponse(
  phoneNumber: string,
  message: string,
): Promise<string> {
  console.log('🧮 handleQuantitySelectionResponse');
  const qtyConv = await restaurantManager.getOrCreateConversation(
    phoneNumber,
    getInitialRestaurantConversation(),
  );
  const cat = TENANT_CONFIG.categories[qtyConv.selectedCategory as Category];
  const menuItem = cat.items[qtyConv.selectedItemIndex!];

  return handleQuantitySelection({
    conversation: qtyConv,
    quantity: parseInt(message.trim(), 10),
    price: menuItem.price,
    deliveryCost: TENANT_CONFIG.deliveryCost,
    updateConversationFn: (updatedCart) =>
      restaurantManager.updateConversation(phoneNumber, {
        step: 'cart_actions',
        cart: updatedCart,
      }),
  });
}

async function handleCartActionsResponse(
  phoneNumber: string,
  message: string,
  conversation: RestaurantConversation,
): Promise<string> {
  console.log('📮 handleCartActionsResponse');
  return handleCartActions({
    conversation,
    option: parseInt(message.trim(), 10),
    deliveryCost: TENANT_CONFIG.deliveryCost,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    updateConversationFn: (upd: Partial<RestaurantConversation>) =>
      restaurantManager.updateConversation(phoneNumber, upd),
    welcomeMessageFn: getWelcomeMessage,
  });
}

async function handleCheckoutResponse(
  phoneNumber: string,
  message: string,
  conversation: RestaurantConversation,
): Promise<string> {
  console.log('🛫 handleCheckoutResponse');
  return handleCheckout({
    conversation,
    option: parseInt(message.trim(), 10),
    deliveryCost: TENANT_CONFIG.deliveryCost,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    updateConversationFn: (upd: Partial<RestaurantConversation>) =>
      restaurantManager.updateConversation(phoneNumber, upd),
    welcomeMessageFn: getWelcomeMessage,
    finalMessageFn: () => getFinalMessage(phoneNumber, conversation.cart),
  });
}

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

// Función principal para ser usada en el webhook
export const conversationHandler = async (
  phoneNumber: string,
  message: string,
): Promise<string> => {
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

// Funciones útiles para UI Test
export const UIClearConversation = (phone: string) => restaurantManager.clearConversation(phone);
export const hasActiveConvo = (phone: string) => restaurantManager.hasActiveConversation(phone);
