// Número de WhatsApp Business - Formato: código país + número
const BUSINESS_NUMBER = '573112112565';

const categories = {
  desayunos: 'desayunos',
  almuerzo: 'almuerzo',
};
type Category = keyof typeof categories;

interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

interface MenuCategory {
  name: string;
  emoji: string;
  items: MenuItem[];
  includes?: string;
}

// Configuración del menú - Fuente única de verdad
const MENU_CONFIG: Record<string, MenuCategory> = {
  [categories.desayunos]: {
    name: 'DESAYUNOS DISPONIBLES',
    emoji: '🌅',
    items: [
      { name: 'Desayuno bogotano', price: 15000 },
      { name: 'Desayuno ranchero', price: 16000 },
      { name: 'Desayuno tolimense con tamal', price: 18000 },
      { name: 'Desayuno llanero', price: 17000 },
      { name: 'Desayuno costeño', price: 16500 },
      { name: 'Desayuno con caldo', price: 14500 },
      { name: 'Regional con calentao', price: 15500 },
    ],
  },
  [categories.almuerzo]: {
    name: 'ALMUERZOS DISPONIBLES',
    emoji: '🍽️',
    includes: 'arroz, aguacate, ensalada, jugo y principio',
    items: [
      { name: 'Almuerzo del día (consulta nuestra imagen de perfil)', price: 18000 },
      { name: 'Ejecutivo con Churrasco', price: 20500 },
      { name: 'Ejecutivo con Pescado sudado', price: 20500 },
      { name: 'Ejecutivo con Pollo especial', price: 20500 },
      { name: 'Ejecutivo con Callo marinera', price: 20500 },
      { name: 'Ejecutivo con Sudado carne yuca', price: 20500 },
      { name: 'Ejecutivo con Pollo sudado yuca', price: 20500 },
      { name: 'Ejecutivo con Mojarra frita', price: 20500 },
      { name: 'Ejecutivo con Carne asada', price: 20500 },
    ],
  },
};

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
  itemIndex: number;
}

interface UserConversation {
  step:
    | 'welcome'
    | 'menu_category'
    | 'breakfast_options'
    | 'lunch_options'
    | 'quantity_selection'
    | 'cart_actions'
    | 'checkout'
    | 'final';
  phoneNumber: string;
  selectedCategory?: Category;
  selectedItem?: string;
  selectedItemIndex?: number;
  cart: CartItem[];
  lastInteraction: number;
}

// Configuración del sistema
const CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const DELIVERY_COST = 2000; // $2.000 por domicilio

// Almacenamiento en memoria de las conversaciones activas
const activeConversations = new Map<string, UserConversation>();

// Utilidades para formatear precios
function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CO')}`;
}

function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function calculateDeliveryTotal(cart: CartItem[]): number {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  return DELIVERY_COST * totalItems;
}

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
}

export function processRestaurantMessage(phoneNumber: string, message: string): string {
  // Primero obtenemos o creamos la conversación
  const conversation = getOrCreateConversation(phoneNumber);

  // Solo reiniciamos si realmente no hay conversación o si carrito está vacío y step is welcome
  const shouldReset =
    !activeConversations.has(phoneNumber) ||
    (conversation.step === 'welcome' && conversation.cart.length === 0);

  if (shouldReset && !hasActiveRestaurantConversation(phoneNumber)) {
    updateConversation(phoneNumber, {
      step: 'welcome',
      selectedCategory: undefined,
      selectedItem: undefined,
      selectedItemIndex: undefined,
      cart: [], // Solo limpiamos el carrito si realmente no hay conversación activa
    });
    return getWelcomeMessage();
  }

  // Procesar según el paso actual
  switch (conversation.step) {
    case 'welcome':
      return handleWelcomeResponse(phoneNumber, message);

    case 'menu_category':
      return handleMenuCategoryResponse(phoneNumber, message);

    case 'breakfast_options':
      return handleItemSelection(phoneNumber, message, categories.desayunos as Category);

    case 'lunch_options':
      return handleItemSelection(phoneNumber, message, categories.almuerzo as Category);

    case 'quantity_selection':
      return handleQuantitySelection(phoneNumber, message);

    case 'cart_actions':
      return handleCartActions(phoneNumber, message);

    case 'checkout':
      return handleCheckout(phoneNumber, message);

    default:
      return getWelcomeMessage();
  }
}

// Generar mensaje de opciones dinámicamente
function generateOptionsMessage(
  items: MenuItem[],
  title: string,
  emoji: string,
  additionalInfo?: string,
): string {
  let message = `${emoji} *${title}*\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}️⃣ ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (additionalInfo) {
    message += `\n${additionalInfo}\n`;
  }

  message += '\n*Elige un número*';
  return message;
}

// Mensaje de bienvenida
function getWelcomeMessage(): string {
  const categories = Object.keys(MENU_CONFIG);
  // prettier-ignore
  let message = '🍽️ Bienvenido a CheFoodie\'s, ¿qué deseas pedir?\n\n';

  categories.forEach((key, index) => {
    const category = MENU_CONFIG[key];
    message += `${index + 1}️⃣ ${category.name.split(' ')[0]}\n`;
  });

  message += '\n*Elige un número*';
  return message;
}

// Manejar respuesta de bienvenida
function handleWelcomeResponse(phoneNumber: string, message: string): string {
  const option = parseInt(message.trim());
  const categories = Object.keys(MENU_CONFIG);

  if (option >= 1 && option <= categories.length) {
    const selectedCategoryKey = categories[option - 1];
    const category = MENU_CONFIG[selectedCategoryKey];

    updateConversation(phoneNumber, {
      step: selectedCategoryKey === 'desayunos' ? 'breakfast_options' : 'lunch_options',
      selectedCategory: selectedCategoryKey as Category,
    });

    // Generar información adicional para almuerzos
    let additionalInfo = '';
    if (category.includes) {
      additionalInfo = `*Todos incluyen:* ${category.includes}`;
    }

    return generateOptionsMessage(category.items, category.name, category.emoji, additionalInfo);
  }

  return getWelcomeMessage();
}

// Manejar selección de categoría del menú
function handleMenuCategoryResponse(phoneNumber: string, message: string): string {
  return handleWelcomeResponse(phoneNumber, message);
}

// Manejar selección de items
function handleItemSelection(phoneNumber: string, message: string, categoryKey: Category): string {
  const category = MENU_CONFIG[categoryKey];
  if (!category) {
    return getWelcomeMessage();
  }

  const option = parseInt(message.trim());

  if (option >= 1 && option <= category.items.length) {
    const selectedItem = category.items[option - 1];
    updateConversation(phoneNumber, {
      step: 'quantity_selection',
      selectedItem: selectedItem.name,
      selectedItemIndex: option - 1,
    });

    return getQuantitySelectionMessage(selectedItem.name, selectedItem.price);
  }

  const additionalInfo = category.includes ? `*Todos incluyen:* ${category.includes}` : '';
  return `❌ Opción no válida. ${generateOptionsMessage(
    category.items,
    category.name,
    category.emoji,
    additionalInfo,
  )}`;
}

// Mensaje de selección de cantidad
function getQuantitySelectionMessage(itemName: string, itemPrice: number): string {
  return `📦 *${itemName}*
Precio: ${formatPrice(itemPrice)}

¿Cuántas unidades deseas?

*Responde con un número (1-10)*`;
}

// Manejar selección de cantidad
function handleQuantitySelection(phoneNumber: string, message: string): string {
  const conversation = getOrCreateConversation(phoneNumber);
  const quantity = parseInt(message.trim());

  if (
    quantity >= 1 &&
    quantity <= 10 &&
    conversation.selectedItem &&
    conversation.selectedCategory &&
    conversation.selectedItemIndex !== undefined
  ) {
    const category = MENU_CONFIG[conversation.selectedCategory];
    const selectedMenuItem = category.items[conversation.selectedItemIndex];

    // Agregar al carrito
    const cartItem: CartItem = {
      name: conversation.selectedItem,
      quantity: quantity,
      price: selectedMenuItem.price,
      category: conversation.selectedCategory,
      itemIndex: conversation.selectedItemIndex,
    };

    conversation.cart.push(cartItem);

    updateConversation(phoneNumber, {
      step: 'cart_actions',
      cart: conversation.cart,
    });

    return getCartActionsMessage(conversation.cart);
  }

  return '❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.';
}

// Mensaje de acciones del carrito
function getCartActionsMessage(cart: CartItem[]): string {
  let message = '🛒 *TU CARRITO*\n\n';

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    message += `👉🏼 ${item.name}\n`;
    message += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  const subtotal = calculateCartTotal(cart);
  const deliveryTotal = calculateDeliveryTotal(cart);
  const total = subtotal + deliveryTotal;

  message += '💰 *RESUMEN*\n';
  message += `Subtotal: ${formatPrice(subtotal)}\n`;
  message += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  message += `*Total: ${formatPrice(total)}*\n\n`;

  message += '¿Qué deseas hacer?\n\n';
  message += '1️⃣ Agregar más productos\n';
  message += '2️⃣ Proceder al pago\n';
  message += '3️⃣ Vaciar carrito\n\n';

  message += '*Elige un número*';

  return message;
}

// Manejar acciones del carrito
function handleCartActions(phoneNumber: string, message: string): string {
  const conversation = getOrCreateConversation(phoneNumber);
  const option = parseInt(message.trim());

  switch (option) {
    case 1:
      // Agregar más productos
      updateConversation(phoneNumber, { step: 'welcome' });
      return getWelcomeMessage();

    case 2:
      // Proceder al checkout
      if (conversation.cart.length === 0) {
        return `❌ Tu carrito está vacío.!\n\n${getWelcomeMessage()}`;
      }
      updateConversation(phoneNumber, { step: 'checkout' });
      return getCheckoutMessage(conversation.cart);

    case 3:
      // Vaciar carrito
      updateConversation(phoneNumber, { cart: [], step: 'welcome' });
      return `🗑️ Carrito vaciado!\n\n${getWelcomeMessage()}`;

    default:
      return `❌ Opción no válida. ${getCartActionsMessage(conversation.cart)}`;
  }
}

// Mensaje de checkout
function getCheckoutMessage(cart: CartItem[]): string {
  let message = '📋 *CONFIRMACIÓN DE PEDIDO*\n\n';

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    message += `👉🏼 ${item.name}\n`;
    message += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  const subtotal = calculateCartTotal(cart);
  const deliveryTotal = calculateDeliveryTotal(cart);
  const total = subtotal + deliveryTotal;

  message += `Subtotal: ${formatPrice(subtotal)}\n`;
  message += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  message += `💰 *TOTAL: ${formatPrice(total)}*\n\n`;

  message += 'Para confirmar tu pedido, por favor:\n\n';
  message += `💸 *Realiza tranferencia al Nequi ${BUSINESS_NUMBER}*\n\n `;
  message += '🧾 (Guarda el comprobante de pago, te lo pediremos en un rato)\n\n';

  message += 'Responde con:\n';
  message += '1️⃣ Confirmar transferencia realizada\n';
  message += '2️⃣ Modificar carrito\n';
  message += '3️⃣ Cancelar pedido\n\n';

  message += '*Elige un número*';

  return message;
}

// Manejar checkout
function handleCheckout(phoneNumber: string, message: string): string {
  const conversation = getOrCreateConversation(phoneNumber);
  const option = parseInt(message.trim());

  switch (option) {
    case 1:
      // Confirmar pedido
      updateConversation(phoneNumber, { step: 'final' });
      return getFinalMessage(conversation.cart);

    case 2:
      // Modificar carrito
      updateConversation(phoneNumber, { step: 'cart_actions' });
      return getCartActionsMessage(conversation.cart);

    case 3:
      // Cancelar pedido
      updateConversation(phoneNumber, { cart: [], step: 'welcome' });
      return `❌ Pedido cancelado!\n\n ${getWelcomeMessage()}`;

    default:
      return `❌ Opción no válida. ${getCheckoutMessage(conversation.cart)}`;
  }
}

// Mensaje final
function getFinalMessage(cart: CartItem[]): string {
  const total = calculateCartTotal(cart) + calculateDeliveryTotal(cart);
  const orderNumber = Date.now().toString().slice(-6);

  // Generar resumen del pedido para WhatsApp
  const orderSummary = generateOrderSummary(cart, total, orderNumber);

  // Generar URL de WhatsApp con mensaje pre-formateado
  const whatsappUrl = `https://wa.me/${BUSINESS_NUMBER}?text=${encodeURIComponent(orderSummary)}`;

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
  const deliveryTotal = calculateDeliveryTotal(cart);

  summary += '💰 *RESUMEN DE PAGO:*\n';
  summary += `Subtotal: ${formatPrice(subtotal)}\n`;
  summary += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  summary += `*TOTAL: ${formatPrice(total)}*\n\n`;

  summary += 'Por favor envia este mensaje (sin modificar)\n';
  summary += 'Seguidamente, envía tu nombre, teléfono, dirección y adjunta imagen de transferencia';

  return summary;
}

// Verificar si hay una conversación activa
export function hasActiveRestaurantConversation(phoneNumber: string): boolean {
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

// Limpiar conversación específica
export function clearRestaurantConversation(phoneNumber: string): void {
  activeConversations.delete(phoneNumber);
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
  for (const [key, category] of Object.entries(MENU_CONFIG)) {
    stats.totalItems[key] = category.items.length;
  }

  // Promedio de items en carrito
  stats.averageCartSize = conversationsWithCart > 0 ? totalCartItems / conversationsWithCart : 0;

  return stats;
}

// Obtener carrito de un usuario específico
export function getUserCart(phoneNumber: string): CartItem[] {
  const conversation = activeConversations.get(phoneNumber);
  return conversation?.cart || [];
}

// Función para obtener configuración del menú
export function getMenuConfig(): typeof MENU_CONFIG {
  return MENU_CONFIG;
}
