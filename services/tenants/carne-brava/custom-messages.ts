import { GetFinalMessageProps, GetWelcomeMessageFn, SequentialFlowConfig } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';
import { tenantCategories, tenantConfig, tenantSortedSteps } from './config';

const logModule = process.env.LOG_TENANT_CONVO === 'true';

const stepsListString = tenantSortedSteps.map((step) => step.name).join(' - ');
const categoriesKeys = Object.keys(tenantCategories || {});
const categoriesListString = categoriesKeys
  .map((key, index) => {
    const category = tenantCategories[key];
    return `${numberToEmoji(index + 1)} ${category.name.split(' ')[0]}`;
  })
  .join('\n');

// Mensajes flujo secuencial
export const sequentialWelcomeMessage = (msgPreliminar = '') => {
  if (logModule) console.log('🗂️ Manejo de bienvenida Flujo secuencial');
  const config = tenantConfig as SequentialFlowConfig;
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  message += `🐂 Bienvenido a Carne Brava. ${config.initialMessage}\n\n`;
  message += `${stepsListString}\n`;
  if (logModule) console.log('👋🏼 config.footerInfo', config.footerInfo);
  if (config.footerInfo) message += `\n${config.footerInfo}\n`;
  message += '\n*Responde 1 para continuar*';
  return message;
};

export const repeatSequentialFlowMessage = () => {
  if (logModule) console.log('👋🏼 repeatSequentialFlowMessage');
  let message =
    '¿Qué deseas añadir a tu pedido? Recuerda que la selección se hace en este orden\n\n';
  message += `${stepsListString}\n\n`;
  message += '*Responde 1 para continuar*';
  return message;
};

// Mensajes flujo por categorías
export const welcomeCategoriesMessage: GetWelcomeMessageFn = (msgPreliminar = '') => {
  if (logModule) console.log('🗂️ Manejo de bienvenida Flujo por categorías');
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  message += '🐂 Bienvenido a Carne Brava, ¿qué deseas pedir?\n\n';
  message += `${categoriesListString}\n\n`;
  message += `*Elige un número (1-${categoriesKeys.length})*`;
  return message;
};

// Mensaje al seleccionar "agregar más items"
export const repeatCategoriesFlowMessage = () => {
  if (logModule) console.log('👋🏼 repeatCategoriesFlowMessage');
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
  message += `💰 *Total:* ${formatPrice(orderData.total)}\n\n`;

  message += '▶️▶️ *CONFIRMAR PEDIDO* ◀️◀️\n';
  message +=
    'Para finalizar tu pedido y enviar el comprobante de pago, haz clic en este enlace:\n\n';
  message += `${fetchOrderUrl}\n\n`;

  message += '📋 *Recuerda incluir:*\n';
  message += '• Comprobante de pago\n';
  message += '• Dirección completa\n';
  message += '• Nombre y teléfono de contacto\n\n';
  message += '¡Gracias por elegir Carne Brava!\n\n';

  return message;
};
