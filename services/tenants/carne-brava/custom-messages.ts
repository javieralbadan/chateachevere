import { createOrder, storeOrderInDB } from '@/services/core/order';
import type { CartItem, GetWelcomeMessageFn, TenantInfo } from '@/types/conversation';
import { SequentialFlowConfig } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';
import { TENANT_CONFIG, TENANT_ID, tenantCategories } from './config';

let categoriesListString = '';
Object.keys(tenantCategories).forEach((key, index) => {
  const category = tenantCategories[key];
  categoriesListString += `${numberToEmoji(index + 1)} ${category.name.split(' ')[0]}\n`;
});

export const getSequentialWelcomeMessage = () => {
  const config = TENANT_CONFIG as SequentialFlowConfig;
  let message = `🍽️ Bienvenido a Carne Brava. ${config.initialMessage}\n\n`;

  // Mostrar las etapas ordenadas
  const sortedSteps = config.steps.sort((a, b) => a.order - b.order);
  sortedSteps.forEach((step, index) => {
    message += `${numberToEmoji(index + 1)} ${step.name}\n`;
  });

  message += '\n*Responde 1 para continuar*';
  return message;
};

// Mensaje de bienvenida
export const getWelcomeMessage: GetWelcomeMessageFn = (msgPreliminar = '') => {
  console.log('👋🏼 getWelcomeMessage');
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  // prettier-ignore
  message += '🍽️ Bienvenido a Carne Brava, ¿qué deseas pedir?\n\n';
  message += categoriesListString;
  message += '\n*Elige un número*';
  return message;
};

// Mensaje al seleccionar "agregar más items"
export const getAddMoreItemsMessage = () => {
  console.log('👋🏼 getAddMoreItemsMessage');
  let message = '¿Qué deseas añadir a tu pedido?\n\n';
  message += categoriesListString;
  message += '\n*Elige un número*';
  return message;
};

// Mensaje final
export const getFinalMessage = async (phoneNumber: string, cart: CartItem[]): Promise<string> => {
  console.log('🏁 getFinalMessage');
  const tenantInfo: TenantInfo = {
    name: TENANT_ID,
    transfersPhoneNumber: TENANT_CONFIG.transfersPhoneNumber,
    deliveryCost: TENANT_CONFIG.deliveryCost,
  };
  const orderData = createOrder({ tenantInfo, phoneNumber, cart });
  const orderId = await storeOrderInDB(orderData);
  console.log('🚀 ~ getFinalMessage ~ orderId, orderData:', orderId, orderData);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatea-chevere.vercel.app';
  const fetchOrderUrl = `${baseUrl}/api/pedido/${orderId}`;

  let message = '*FINALIZACIÓN DE PEDIDO*\n\n';
  message += `📝 *Número de pedido:* #${orderData.orderNumber}\n`;
  message += `💰 *Total:* ${formatPrice(orderData.total)}\n`;
  message += '⏱️ *Tiempo estimado:* 30-45 minutos\n\n';

  message += '▶️▶️ *CONFIRMAR PEDIDO* ◀️◀️\n';
  message +=
    'Para finalizar tu pedido y enviar el comprobante de pago, haz clic en este enlace:\n\n';
  message += `${fetchOrderUrl}\n\n`;

  message += '📋 *Recuerda incluir:*\n';
  message += '• Comprobante de pago\n';
  message += '• Dirección completa\n';
  message += '• Nombre y teléfono de contacto\n\n';
  // prettier-ignore
  message += '¡Gracias por elegir CheFoodie\'s!\n\n';

  return message;
};
