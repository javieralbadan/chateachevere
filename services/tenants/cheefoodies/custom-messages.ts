import type { GetFinalMessageProps, GetWelcomeMessageFn } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';
import { tenantCategories } from './config';

const logModule = process.env.LOG_TENANT_CONVO === 'true';

const categoriesKeys = Object.keys(tenantCategories || {});
const categoriesListString = categoriesKeys
  .map((key, index) => {
    const category = tenantCategories[key];
    return `${numberToEmoji(index + 1)} ${category.name}`;
  })
  .join('\n');

// Mensaje de bienvenida
export const getWelcomeMessage: GetWelcomeMessageFn = (msgPreliminar = '') => {
  if (logModule) console.log('👋🏼 getWelcomeMessage');
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  // prettier-ignore
  message += '🍽️ Te damos la bienvenida a CheFoodie\'s, ¿qué deseas pedir?\n\n';
  message += `${categoriesListString}\n\n`;
  message += `*Elige un número (1-${categoriesKeys.length})*`;
  return message;
};

// Mensaje al seleccionar "agregar más items"
export const getRepeatFlowMessage = () => {
  if (logModule) console.log('👋🏼 getRepeatFlowMessage');
  let message = '¿Qué deseas añadir a tu pedido?\n\n';
  message += `${categoriesListString}\n\n`;
  message += `*Elige un número (1-${categoriesKeys.length})*`;
  return message;
};

// Mensaje final
export const getFinalMessage = ({ orderId, orderData }: GetFinalMessageProps): string => {
  if (logModule) console.log('🏁 getFinalMessage', orderId, orderData);

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
