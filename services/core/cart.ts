import { formatPrice } from '../utils';
import { UserConversation } from './conversation';

export interface CartItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
  itemIndex: number;
}

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function calculateDeliveryTotal(cart: CartItem[], deliveryCost: number): number {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  return deliveryCost * totalItems;
}

interface HandleQuantitySelectionProps {
  conversation: UserConversation;
  message: string;
  price: number;
  deliveryCost: number;
  updateConversationFn: (cartItem: CartItem) => void;
}

// Manejar selección de cantidad
export function handleQuantitySelection({
  conversation,
  message,
  price,
  deliveryCost,
  updateConversationFn,
}: HandleQuantitySelectionProps): string {
  const quantity = parseInt(message.trim());

  if (
    quantity >= 1 &&
    quantity <= 10 &&
    conversation.selectedItem &&
    conversation.selectedCategory &&
    conversation.selectedItemIndex !== undefined
  ) {
    // Agregar al carrito
    const cartItem: CartItem = {
      name: conversation.selectedItem,
      quantity,
      price,
      category: conversation.selectedCategory,
      itemIndex: conversation.selectedItemIndex,
    };
    updateConversationFn(cartItem);

    return getCartActionsMessage(conversation.cart, deliveryCost);
  }

  return '❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.';
}

// Mensaje de acciones del carrito
function getCartActionsMessage(cart: CartItem[], deliveryCost: number): string {
  let message = '🛒 *TU CARRITO*\n\n';

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    message += `👉🏼 ${item.name}\n`;
    message += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  const subtotal = calculateCartTotal(cart);
  const deliveryTotal = calculateDeliveryTotal(cart, deliveryCost);
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

interface HandleCartActionsProps {
  conversation: UserConversation;
  option: number;
  deliveryCost: number;
  transfersPhoneNumber: string;
  updateConversationFn: (updates: Partial<UserConversation>) => void;
  getWelcomeMessageFn: () => string;
}

// Manejar acciones del carrito
export function handleCartActions({
  conversation,
  option,
  deliveryCost,
  transfersPhoneNumber,
  updateConversationFn,
  getWelcomeMessageFn,
}: HandleCartActionsProps): string {
  switch (option) {
    case 1:
      // Agregar más productos
      updateConversationFn({ step: 'welcome' });
      return getWelcomeMessageFn();

    case 2:
      // Proceder al checkout
      if (conversation.cart.length === 0) {
        return `❌ Tu carrito está vacío.!\n\n${getWelcomeMessageFn()}`;
      }
      updateConversationFn({ step: 'checkout' });
      return getCheckoutMessage({
        cart: conversation.cart,
        deliveryCost,
        transfersPhoneNumber,
      });

    case 3:
      // Vaciar carrito
      updateConversationFn({ cart: [], step: 'welcome' });
      return `🗑️ Carrito vaciado!\n\n${getWelcomeMessageFn()}`;

    default:
      return `❌ Opción no válida.\n\n${getCartActionsMessage(conversation.cart, deliveryCost)}`;
  }
}

interface GetCheckoutMessageProps {
  cart: CartItem[];
  deliveryCost: number;
  transfersPhoneNumber: string;
}

// Mensaje de checkout
function getCheckoutMessage({
  cart,
  deliveryCost,
  transfersPhoneNumber,
}: GetCheckoutMessageProps): string {
  let message = '📋 *CONFIRMACIÓN DE PEDIDO*\n\n';

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    message += `👉🏼 ${item.name}\n`;
    message += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  const subtotal = calculateCartTotal(cart);
  const deliveryTotal = calculateDeliveryTotal(cart, deliveryCost);
  const total = subtotal + deliveryTotal;

  message += `Subtotal: ${formatPrice(subtotal)}\n`;
  message += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  message += `💰 *TOTAL: ${formatPrice(total)}*\n\n`;

  message += 'Para confirmar tu pedido, por favor:\n\n';
  message += `💸 *Realiza tranferencia al Nequi ${transfersPhoneNumber}*\n\n `;
  message += '🧾 (Guarda el comprobante de pago, te lo pediremos en un rato)\n\n';

  message += 'Responde con:\n';
  message += '1️⃣ Confirmar transferencia realizada\n';
  message += '2️⃣ Modificar carrito\n';
  message += '3️⃣ Cancelar pedido\n\n';

  message += '*Elige un número*';

  return message;
}

interface HandleCheckoutProps {
  message: string;
  conversation: UserConversation;
  deliveryCost: number;
  transfersPhoneNumber: string;
  updateConversationFn: (updates: Partial<UserConversation>) => void;
  getWelcomeMessageFn: () => string;
  getFinalMessageFn: () => string;
}

// Manejar checkout
export function handleCheckout({
  message,
  conversation,
  deliveryCost,
  transfersPhoneNumber,
  updateConversationFn,
  getWelcomeMessageFn,
  getFinalMessageFn,
}: HandleCheckoutProps): string {
  const option = parseInt(message.trim());

  switch (option) {
    case 1:
      // Confirmar pedido
      updateConversationFn({ step: 'final' });
      return getFinalMessageFn();

    case 2:
      // Modificar carrito
      updateConversationFn({ step: 'cart_actions' });
      return getCartActionsMessage(conversation.cart, deliveryCost);

    case 3:
      // Cancelar pedido
      updateConversationFn({ cart: [], step: 'welcome' });
      return `❌ Pedido cancelado!\n\n${getWelcomeMessageFn()}`;

    default:
      return `❌ Opción no válida.\n\n${getCheckoutMessage({
        cart: conversation.cart,
        deliveryCost,
        transfersPhoneNumber,
      })}`;
  }
}
