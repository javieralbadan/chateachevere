import { formatPrice } from '../utils';
import {
  CartActionsFn,
  CartItem,
  CheckoutFn,
  CheckoutMessageFn,
  QuantitySelectionFn,
} from './types';

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function calculateDeliveryTotal(cart: CartItem[], deliveryCost: number): number {
  if (!deliveryCost) return 0;

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  return deliveryCost * totalItems;
}

// Manejar selección de cantidad
export const handleQuantitySelection: QuantitySelectionFn = async ({
  conversation,
  quantity,
  price,
  deliveryCost,
  updateConversationFn,
}) => {
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
    const updatedCart = [...conversation.cart, cartItem];
    await updateConversationFn(updatedCart);

    return getCartActionsMessage(updatedCart, deliveryCost);
  }

  return '❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.';
};

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

// Manejar acciones del carrito [cart_actions]
export const handleCartActions: CartActionsFn = async ({
  conversation,
  option,
  deliveryCost,
  transfersPhoneNumber,
  updateConversationFn,
  welcomeMessageFn,
  addMoreItemsFn,
}) => {
  // Titulo: "TU CARRITO"
  switch (option) {
    case 1:
      // Agregar más productos
      await updateConversationFn({ step: 'category_selection' });
      return addMoreItemsFn();

    case 2:
      // Proceder al checkout
      if (conversation.cart.length === 0) {
        return welcomeMessageFn('❌ Tu carrito está vacío!');
      }

      await updateConversationFn({ step: 'checkout' });
      return getCheckoutMessage({
        cart: conversation.cart,
        deliveryCost,
        transfersPhoneNumber,
      });

    case 3:
      // Vaciar carrito
      await updateConversationFn({ cart: [], step: 'category_selection' });
      return welcomeMessageFn('🗑️ Carrito vaciado!');

    default:
      return `❌ Opción no válida.\n\n${getCartActionsMessage(conversation.cart, deliveryCost)}`;
  }
};

// Mensaje de checkout
const getCheckoutMessage: CheckoutMessageFn = ({ cart, deliveryCost, transfersPhoneNumber }) => {
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
  message += '2️⃣ Agregar más productos\n';
  message += '3️⃣ Cancelar pedido\n\n';

  message += '*Elige un número*';

  return message;
};

// Manejar seleccion hecha en checkout
export const handleCheckout: CheckoutFn = async ({
  conversation,
  option,
  deliveryCost,
  transfersPhoneNumber,
  updateConversationFn,
  welcomeMessageFn,
  addMoreItemsFn,
  finalMessageFn,
}) => {
  // Titulo: "CONFIRMACIÓN DE PEDIDO"
  switch (option) {
    case 1:
      // Confirmar pago
      await updateConversationFn({ step: 'final' });
      return await finalMessageFn();

    case 2:
      // Agregar más productos
      await updateConversationFn({ step: 'category_selection' });
      return addMoreItemsFn();

    case 3:
      // Cancelar pedido
      await updateConversationFn({ cart: [], step: 'category_selection' });
      return welcomeMessageFn('❌ Pedido cancelado!');

    default:
      return `❌ Opción no válida.\n\n${getCheckoutMessage({
        cart: conversation.cart,
        deliveryCost,
        transfersPhoneNumber,
      })}`;
  }
};
