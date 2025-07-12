import {
  calculateCartTotal,
  calculateDeliveryTotal,
  CartItem,
  handleCartActions,
  handleCheckout,
  handleQuantitySelection,
} from '@/services/core/cart';
import { UserConversation } from '@/services/core/conversation';
import { generateOptionsMessage, handleItemSelection, MenuItem } from '@/services/core/menu';
import { formatPrice } from '@/services/utils';
import { Category, TENANT_CONFIG } from './config';

const isDev = process.env.NODE_ENV === 'development';
// Configuración del sistema
const CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
// Almacenamiento en memoria de las conversaciones activas
const activeConversations = new Map<string, UserConversation>();

// Limpiar conversaciones antiguas
function cleanupOldConversations() {
  const timeoutAgo = Date.now() - CONVERSATION_TIMEOUT;
  const conversationsToDelete: string[] = [];

  for (const [phone, conversation] of activeConversations.entries()) {
    // No eliminar conversaciones que tengan items en el carrito, sin importar el tiempo
    if (conversation.cart.length > 0) {
      continue;
    }

    // Solo eliminar si realmente ha pasado mucho tiempo y no hay carrito
    if (conversation.lastInteraction < timeoutAgo) {
      conversationsToDelete.push(phone);
    }
  }

  // Eliminar las conversaciones marcadas
  conversationsToDelete.forEach((phone) => {
    activeConversations.delete(phone);
  });
}

// Obtener o crear conversación
function getOrCreateConversation(phoneNumber: string): UserConversation {
  cleanupOldConversations();

  let conversation = activeConversations.get(phoneNumber);
  if (!conversation) {
    conversation = {
      step: 'welcome',
      phoneNumber,
      cart: [],
      lastInteraction: Date.now(),
    };
    activeConversations.set(phoneNumber, conversation);
  }

  return conversation;
}

// Actualizar conversación
function updateConversation(phoneNumber: string, updates: Partial<UserConversation>) {
  const conversation = getOrCreateConversation(phoneNumber);
  Object.assign(conversation, updates, { lastInteraction: Date.now() });
  activeConversations.set(phoneNumber, conversation);

  if (isDev) {
    console.log('▶️ currentStep:', activeConversations.get(phoneNumber)?.step);
    console.log('currentConversation:', activeConversations.get(phoneNumber));
  }
}

// Limpiar conversación específica
export function clearConversation(phoneNumber: string): void {
  activeConversations.delete(phoneNumber);
}

// Verificar si hay una conversación activa
export function hasActiveConversation(phoneNumber: string): boolean {
  // Primero verificar si existe la conversación
  const conversation = activeConversations.get(phoneNumber);
  if (!conversation) {
    return false;
  }

  // Si tiene items en el carrito, considerarla activa sin importar el tiempo
  if (conversation.cart.length > 0) {
    return true;
  }

  // Solo hacer cleanup si no hay carrito
  cleanupOldConversations();
  return activeConversations.has(phoneNumber);
}

export function processMessage(phoneNumber: string, message: string): string {
  // Primero obtenemos o creamos la conversación
  const conversation = getOrCreateConversation(phoneNumber);

  // Solo reiniciamos si realmente no hay conversación o si carrito está vacío y step is welcome
  const shouldReset =
    !activeConversations.has(phoneNumber) ||
    (conversation.step === 'welcome' && conversation.cart.length === 0);

  if (shouldReset && !hasActiveConversation(phoneNumber)) {
    clearConversation(phoneNumber);
    // updateConversation(phoneNumber, {
    //   step: 'welcome',
    //   selectedCategory: undefined,
    //   selectedItem: undefined,
    //   selectedItemIndex: undefined,
    //   cart: [], // Solo limpiamos el carrito si realmente no hay conversación activa
    // });
    return getWelcomeMessage();
  }

  console.log('🚀 ~ processMessage ~ conversation.step:', conversation.step);
  // Procesar según el paso actual
  switch (conversation.step) {
    case 'welcome':
      return handleWelcomeResponse(phoneNumber);

    case 'category_selection':
      return handleCategoryResponse(phoneNumber, message);

    case 'item_selection':
      return handleItemSelection({
        message,
        category: TENANT_CONFIG.categories[conversation.selectedCategory!],
        welcomeMessageFn: getWelcomeMessage,
        // TODO: Reducir complejidad quizá
        updateConversationFn: (option: number, selectedItem: MenuItem) => {
          updateConversation(phoneNumber, {
            step: 'quantity_selection',
            selectedItem: selectedItem.name,
            selectedItemIndex: option - 1,
          });
        },
      });

    case 'quantity_selection':
      const qtyConversation = getOrCreateConversation(phoneNumber);
      const category = TENANT_CONFIG.categories[qtyConversation.selectedCategory as Category];
      const selectedMenuItem = category.items[qtyConversation.selectedItemIndex as number];

      return handleQuantitySelection({
        conversation: qtyConversation,
        message,
        price: selectedMenuItem.price,
        deliveryCost: TENANT_CONFIG.deliveryCost,
        updateConversationFn: (cartItem: CartItem) => {
          conversation.cart.push(cartItem);
          updateConversation(phoneNumber, {
            step: 'cart_actions',
            cart: conversation.cart,
          });
        },
      });

    case 'cart_actions':
      const actionsConversation = getOrCreateConversation(phoneNumber);
      const option = parseInt(message.trim());

      return handleCartActions({
        conversation: actionsConversation,
        option,
        deliveryCost: TENANT_CONFIG.deliveryCost,
        transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
        updateConversationFn: (updates: Partial<UserConversation>) => {
          updateConversation(phoneNumber, updates);
        },
        getWelcomeMessageFn: getWelcomeMessage,
      });

    case 'checkout':
      const checkoutConversation = getOrCreateConversation(phoneNumber);

      return handleCheckout({
        message,
        conversation: checkoutConversation,
        deliveryCost: TENANT_CONFIG.deliveryCost,
        transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
        updateConversationFn: (updates: Partial<UserConversation>) => {
          updateConversation(phoneNumber, updates);
        },
        getWelcomeMessageFn: getWelcomeMessage,
        getFinalMessageFn: () => getFinalMessage(phoneNumber, conversation.cart),
      });

    default:
      return getWelcomeMessage();
  }
}

// Mensaje de bienvenida
function getWelcomeMessage(msgPreliminar: string = ''): string {
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
}

// Manejar respuesta de bienvenida
function handleWelcomeResponse(phoneNumber: string): string {
  updateConversation(phoneNumber, {
    step: 'category_selection',
  });
  return getWelcomeMessage();
}

// Manejar respuesta de selección de categoria
function handleCategoryResponse(phoneNumber: string, message: string): string {
  const option = parseInt(message.trim());
  const categories = Object.keys(TENANT_CONFIG.categories);

  if (option >= 1 && option <= categories.length) {
    const selectedCategoryKey = categories[option - 1];
    const category = TENANT_CONFIG.categories[selectedCategoryKey];

    updateConversation(phoneNumber, {
      step: 'item_selection',
      selectedCategory: selectedCategoryKey,
    });

    // Generar información adicional para almuerzos
    let additionalInfo = '';
    if (category.includes) {
      additionalInfo = `*Todos incluyen:* ${category.includes}`;
    }

    return generateOptionsMessage({
      emoji: category.emoji,
      title: category.name,
      items: category.items,
      additionalInfo: additionalInfo,
    });
  }

  return getWelcomeMessage(message ? '❌ Opción no válida.' : '');
}

// Mensaje final
function getFinalMessage(phoneNumber: string, cart: CartItem[]): string {
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

  clearConversation(phoneNumber);

  return message;
}

function generateOrderSummary(cart: CartItem[], total: number, orderNumber: string): string {
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

// Obtener estadísticas de conversaciones activas
export function getActiveConversationsStats(): {
  total: number;
  byStep: Record<string, number>;
  totalItems: Record<string, number>;
  averageCartSize: number;
} {
  cleanupOldConversations();
  const stats = {
    total: activeConversations.size,
    byStep: {} as Record<string, number>,
    totalItems: {} as Record<string, number>,
    averageCartSize: 0,
  };

  let totalCartItems = 0;
  let conversationsWithCart = 0;

  // Estadísticas por paso
  for (const conversation of activeConversations.values()) {
    stats.byStep[conversation.step] = (stats.byStep[conversation.step] || 0) + 1;

    if (conversation.cart.length > 0) {
      totalCartItems += conversation.cart.length;
      conversationsWithCart++;
    }
  }

  // Estadísticas de items del menú
  for (const [key, category] of Object.entries(TENANT_CONFIG.categories)) {
    stats.totalItems[key] = category.items.length;
  }

  // Promedio de items en carrito
  stats.averageCartSize = conversationsWithCart > 0 ? totalCartItems / conversationsWithCart : 0;

  return stats;
}
