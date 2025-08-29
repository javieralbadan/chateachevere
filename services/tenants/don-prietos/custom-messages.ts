import { Category, GetFinalMessageProps, GetWelcomeMessageFn } from '@/types/menu';
import { formatPriceShort, numberToEmoji } from '@/utils/formatters';
import { tenantCategories } from './config';

const logModule = process.env.LOG_TENANT_CONVO === 'true';

const categoriesKeys = Object.keys(tenantCategories || {});
const categoriesListString = categoriesKeys
  .map((key, index) => {
    const category = tenantCategories[key];
    return `${numberToEmoji(index + 1)} ${category.name}`;
  })
  .join('\n');

// Mensajes flujo por categorías
export const welcomeMessage: GetWelcomeMessageFn = (msgPreliminar = '') => {
  if (logModule) console.log('🗂️ Manejo de bienvenida Flujo por categorías');
  let message = msgPreliminar ? `${msgPreliminar}\n\n` : '';
  message += '🐂 Bienvenidos a Don Prietos, ¿qué deseas pedir?\n\n';
  message += `${categoriesListString}\n\n`;
  message += `*Elige un número (1-${categoriesKeys.length})*`;
  return message;
};

// Mensaje al seleccionar "agregar más items"
export const repeatFlowMessage = () => {
  if (logModule) console.log('👋🏼 repeatCategoriesFlowMessage');
  let message = '¿Qué deseas añadir a tu pedido?\n\n';
  message += `${categoriesListString}\n\n`;
  message += `*Elige un número (1-${categoriesKeys.length})*`;
  return message;
};

export const itemsSelectionMessage = ({ emoji, name, items, footerInfo }: Category) => {
  let message = `${emoji} *${name}*\n\n`;

  items.forEach((item, index) => {
    message += `${numberToEmoji(index + 1)} ${item.name} - ${formatPriceShort(item.price)}\n`;
    message += item.description ? `${item.description}\n` : '';
    message += '\n';
  });

  if (footerInfo) message += `${footerInfo}\n`;
  message += '*Elige un número*';

  return message;
};

// Mensaje final
export const getFinalMessage = ({
  transfersPhoneNumber,
  orderData,
}: GetFinalMessageProps): string => {
  if (logModule) console.log('🏁 getFinalMessage', orderData);

  let message = '*PEDIDO CONFIRMADO*\n\n';
  message += `📝 *Número:* #${orderData.orderNumber}\n`;
  message += `💰 *Total:* ${formatPriceShort(orderData.total)}\n`;
  message += '⏱️ *Tiempo estimado:* 30-45 minutos\n\n';

  message += '▶️▶️ *NOTA IMPORTANTE* ◀️◀️\n';
  message += 'Para marchar tu pedido, favor enviar el comprobante de pago al siguiente número:\n';
  message += `${transfersPhoneNumber}\n\n`;

  message += '¡Gracias por elegir Don Prietos!';

  return message;
};
