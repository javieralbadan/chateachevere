import {
  calculateCartTotal,
  calculateDeliveryTotal,
  CartItem,
  handleCartActions,
  handleCheckout,
  handleQuantitySelection,
} from '@/services/core/cart';
import { BaseConversation, createConversationManager } from '@/services/core/conversation';
import { handleCategorySelection, handleItemSelection } from '@/services/core/menu';
import { formatPrice } from '@/services/utils';
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
  config: { timeoutMinutes: 15 },
  stepHandlers: {
    welcome: handleWelcomeResponse,
    category_selection: handleCategorySelectionResponse,
    item_selection: handleItemSelectionResponse,
    quantity_selection: handleQuantitySelectionResponse,
    cart_actions: handleCartActionsResponse,
    checkout: handleCheckoutResponse,
  },
  defaultStep: 'welcome',
});

// Mensaje de bienvenida
const getWelcomeMessage = (msgPreliminar: string = ''): string => {
  console.log('👋🏼 getWelcomeMessage');
  const categories = Object.keys(TENANT_CONFIG.categories);
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  // prettier-ignore
  message += '🍽️ Bienvenido a CheFoodie\'s, ¿qué deseas pedir?\n\n';

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
        cart: updatedCart as CartItem[],
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
    getWelcomeMessageFn: getWelcomeMessage,
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
    getWelcomeMessageFn: getWelcomeMessage,
    getFinalMessageFn: () => getFinalMessage(phoneNumber, conversation.cart),
  });
}

// Mensaje final
const getFinalMessage = async (phoneNumber: string, cart: CartItem[]): Promise<string> => {
  console.log('🏁 getFinalMessage');
  const total = calculateCartTotal(cart) + calculateDeliveryTotal(cart, TENANT_CONFIG.deliveryCost);
  const orderNumber = Date.now().toString().slice(-6);

  // Generar resumen del pedido para WhatsApp
  const orderSummary = generateOrderSummary(cart, total, orderNumber);

  // Generar URL de WhatsApp con mensaje pre-formateado
  const whatsappUrl = `https://wa.me/${TENANT_CONFIG.transfersPhoneNumber}?text=${encodeURIComponent(orderSummary)}`;

  let message = '*FINALIZACIÓN DE PEDIDO*\n\n';
  message += `📝 *Número de pedido:* #${orderNumber}\n`;
  message += `💰 *Total:* ${formatPrice(total)}\n`;
  message += '⏱️ *Tiempo estimado:* 30-45 minutos\n\n';

  message += '▶️▶️ *CONFIRMAR PEDIDO* ◀️◀️\n';
  message +=
    'Para finalizar tu pedido y enviar el comprobante de pago, haz clic en este enlace:\n\n';
  message += `${whatsappUrl}\n\n`;

  message += '📋 *Recuerda incluir:*\n';
  message += '• Comprobante de pago\n';
  message += '• Dirección completa\n';
  message += '• Nombre y teléfono de contacto\n\n';
  // prettier-ignore
  message += '¡Gracias por elegir CheFoodie\'s!\n\n';

  await restaurantManager.clearConversation(phoneNumber);

  return message;
};

function generateOrderSummary(cart: CartItem[], total: number, orderNumber: string): string {
  console.log('📋 generateOrderSummary');
  let summary = `🍽️ *NUEVO PEDIDO #${orderNumber}*\n`;
  summary += `${new Date().toLocaleString('es-CO')}\n\n`;

  summary += '📋 *DETALLE DEL PEDIDO:*\n';
  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    summary += `👉🏼 ${item.name}\n`;
    summary += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  const subtotal = calculateCartTotal(cart);
  const deliveryTotal = calculateDeliveryTotal(cart, TENANT_CONFIG.deliveryCost);

  summary += '💰 *RESUMEN DE PAGO:*\n';
  summary += `Subtotal: ${formatPrice(subtotal)}\n`;
  summary += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  summary += `*TOTAL: ${formatPrice(total)}*\n\n`;

  summary += 'Por favor envia este mensaje (sin modificar)\n';
  summary += 'Seguidamente, envía tu nombre, teléfono, dirección y adjunta imagen de transferencia';

  return summary;
}

// Función principal para ser usada en el webhook
export const conversationHandler = async (
  phoneNumber: string,
  message: string,
): Promise<string> => {
  return restaurantManager.processMessage(
    phoneNumber,
    message,
    getInitialRestaurantConversation,
    getWelcomeMessage,
  );
};

// Funciones útiles para UI Test
export const UIClearConversation = (phone: string) => restaurantManager.clearConversation(phone);
export const hasActiveConvo = (phone: string) => restaurantManager.hasActiveConversation(phone);
