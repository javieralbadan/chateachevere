import type {
  CartConversation,
  CartItem,
  CheckoutMessageFn,
  RepeatFlowConvoStep,
  TenantInfo,
  ValidateItemReturn,
} from '@/types/conversation';
import { CartHandlersProps as Props, StepHandler } from '@/types/menu';
import { formatPrice } from '@/utils/formatters';
import { createOrder, storeOrderInDB } from './order';

const logModule = process.env.LOG_CORE_CART === 'true';

export const createCartHandlers = ({ tenantConfig, manager, conditionalMessages }: Props) => {
  const customMessages = conditionalMessages[tenantConfig.flowType]!;
  const isSequentialConvo = tenantConfig.flowType === 'sequential';
  const repeatFlowStep: RepeatFlowConvoStep = isSequentialConvo
    ? 'sequential_welcome'
    : 'category_selection';

  // Handler para selección de cantidad [quantity_selection]
  const quantitySelection: StepHandler = async ({ phoneNumber, message, conversation }) => {
    const quantity = parseInt(message.trim(), 10);

    // Validar cantidad
    if (isNaN(quantity) || quantity < 1 || quantity > 10) {
      return '❌ Cantidad no válida. Por favor ingresa un número entre 1 y 10.';
    }

    // Validar que hay un item válido para agregar al carrito
    const itemToAdd = validateAndGetItemForCart(conversation);
    if (!itemToAdd.isValid) {
      if (logModule) console.log('❌ No hay item válido para agregar:', itemToAdd.error);
      return customMessages.getWelcomeMessage(`❌ ${itemToAdd.error}`);
    }

    // Crear CartItem
    const cartItem: CartItem = {
      name: itemToAdd.name!,
      quantity,
      price: itemToAdd.price!,
      category: itemToAdd.category!,
    };

    if (logModule) console.log('newCartItem:', cartItem);

    const updatedCart = [...conversation.cart, cartItem];
    if (logModule) console.log('updatedCart:', updatedCart);

    // Actualizar conversación - limpiar campos temporales
    await manager.updateConversation(phoneNumber, {
      step: 'cart_actions',
      cart: updatedCart,
      selectedCategory: undefined,
      selectedItem: undefined,
      sequentialFlow: undefined,
    });

    return getCartActionsMessage(updatedCart, tenantConfig.deliveryCost);
  };

  // Handler para acciones del carrito [cart_actions] - Titulo: "TU CARRITO"
  const cartActions: StepHandler = async ({ phoneNumber, message, conversation }) => {
    const option = parseInt(message.trim(), 10);

    switch (option) {
      case 1:
        // Agregar más productos
        await manager.updateConversation(phoneNumber, { step: repeatFlowStep });
        return customMessages.getRepeatFlowMessage();

      case 2:
        // Proceder al checkout
        if (conversation.cart.length === 0) {
          return customMessages.getWelcomeMessage('❌ Tu carrito está vacío!');
        }

        await manager.updateConversation(phoneNumber, { step: 'checkout' });
        return getCheckoutMessage({
          cart: conversation.cart,
          deliveryCost: tenantConfig.deliveryCost,
          transfersPhoneNumber: tenantConfig.transfersPhoneNumber,
        });

      case 3:
        // Vaciar carrito
        await manager.updateConversation(phoneNumber, {
          cart: [],
          step: repeatFlowStep,
        });
        return customMessages.getWelcomeMessage('🗑️ Carrito vaciado!');

      default:
        return `❌ Opción no válida.\n\n${getCartActionsMessage(conversation.cart, tenantConfig.deliveryCost)}`;
    }
  };

  // Handler para checkout [checkout] - Titulo: "CONFIRMACIÓN DE PEDIDO"
  const checkout: StepHandler = async ({ phoneNumber, message, conversation }) => {
    const option = parseInt(message.trim(), 10);

    switch (option) {
      case 1:
        // -> Confirmar pago. TODO: Check si es necesario hacer este update, al final se hace clean
        await manager.updateConversation(phoneNumber, { step: 'final' });

        const tenantInfo: TenantInfo = {
          name: tenantConfig.tenantId,
          transfersPhoneNumber: tenantConfig.transfersPhoneNumber,
          deliveryCost: tenantConfig.deliveryCost,
        };
        if (logModule) console.log('Creando orden para ', tenantConfig.tenantId);
        const orderData = createOrder({ tenantInfo, phoneNumber, cart: conversation.cart });
        const orderId = await storeOrderInDB(orderData);

        await manager.clearConversation(phoneNumber);

        return customMessages.getFinalMessage({ orderId, orderData });

      case 2:
        // Agregar más productos
        await manager.updateConversation(phoneNumber, { step: repeatFlowStep });
        return customMessages.getRepeatFlowMessage();

      case 3:
        // Cancelar pedido
        await manager.updateConversation(phoneNumber, {
          cart: [],
          step: repeatFlowStep,
        });
        return customMessages.getWelcomeMessage('❌ Pedido cancelado!');

      default:
        return `❌ Opción no válida.\n\n${getCheckoutMessage({
          cart: conversation.cart,
          deliveryCost: tenantConfig.deliveryCost,
          transfersPhoneNumber: tenantConfig.transfersPhoneNumber,
        })}`;
    }
  };

  return { quantitySelection, cartActions, checkout };
};

// ===== HELPERS =====

// Validar y obtener item para agregar al carrito
function validateAndGetItemForCart(conversation: CartConversation): ValidateItemReturn {
  // Caso 1: Item regular (categories flow)
  if (conversation.selectedItem && conversation.selectedCategory) {
    if (!conversation.selectedItem.name || conversation.selectedItem.price === undefined) {
      return { isValid: false, error: 'Datos del item incompletos.' };
    }
    return {
      isValid: true,
      name: conversation.selectedItem.name,
      price: conversation.selectedItem.price,
      category: conversation.selectedCategory,
    };
  }

  // Caso 2: Item customizado (sequential flow)
  if (conversation.sequentialFlow?.customizedItem) {
    const customItem = conversation.sequentialFlow.customizedItem;
    if (!customItem.name || customItem.price === undefined) {
      return { isValid: false, error: 'Datos del item customizado incompletos.' };
    }
    return {
      isValid: true,
      name: customItem.name,
      price: customItem.price,
      category: 'customized_item',
    };
  }

  // No hay item válido
  return { isValid: false, error: 'No hay item seleccionado.' };
}

const getCartActionsMessage = (cart: CartItem[], deliveryCost: number): string => {
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
  if (deliveryTotal) {
    message += `Subtotal: ${formatPrice(subtotal)}\n`;
    message += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  }
  message += `*Total: ${formatPrice(total)}*\n\n`;

  message += '¿Qué deseas hacer?\n\n';
  message += '1️⃣ Agregar más productos\n';
  message += '2️⃣ Proceder al pago\n';
  message += '3️⃣ Vaciar carrito\n\n';
  message += '*Elige un número (1-3)*';

  return message;
};

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
  message += `💸 *Realiza transferencia al Nequi ${transfersPhoneNumber}*\n\n `;
  message += '🧾 (Guarda el comprobante de pago, te lo pediremos en un rato)\n\n';

  message += 'Responde con:\n';
  message += '1️⃣ Confirmar transferencia realizada\n';
  message += '2️⃣ Agregar más productos\n';
  message += '3️⃣ Cancelar pedido\n\n';
  message += '*Elige un número (1-3)*';

  return message;
};

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function calculateDeliveryTotal(cart: CartItem[], deliveryCost: number): number {
  if (!deliveryCost) return 0;
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  return deliveryCost * totalItems;
}
