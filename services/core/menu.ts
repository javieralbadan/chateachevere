import type { CategorySelectionPropsFn, ItemSelectionPropsFn } from '@/types/conversation';
import { Category } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';

const logModule = process.env.LOG_CORE_MENU === 'true';

// Manejar respuesta de selección de categoria
export const handleCategorySelection: CategorySelectionPropsFn = async ({
  message,
  categories,
  welcomeMessageFn,
  updateConversationFn,
}) => {
  if (!Object.keys(categories).length) return welcomeMessageFn();

  if (logModule) console.log('🗃️ handleCategorySelection', message, categories);
  const option = parseInt(message.trim());
  const categoriesKeys = Object.keys(categories); // Ej: ['desayunos', 'almuerzos']

  if (option >= 1 && option <= categoriesKeys.length) {
    const selectedCategoryKey: string = categoriesKeys[option - 1];
    await updateConversationFn(selectedCategoryKey);
    const selectedCategory = categories[selectedCategoryKey];
    if (logModule) console.log('🚀 ~ selectedCategoryKey:', selectedCategoryKey);

    return getItemsSelectionMessage(selectedCategory);
  }

  return welcomeMessageFn(option ? '❌ Opción no válida.' : '');
};

// Manejar selección de items
export const handleItemSelection: ItemSelectionPropsFn = async ({
  message,
  category,
  welcomeMessageFn,
  updateConversationFn,
}) => {
  if (!category && welcomeMessageFn()) return welcomeMessageFn();

  if (logModule) console.log('⛏️ handleItemSelection:', message, category);
  const option = parseInt(message.trim());

  if (option >= 1 && option <= category.items.length) {
    const selectedItem = category.items[option - 1];
    await updateConversationFn(option, selectedItem);
    const itemPrice = formatPrice(selectedItem.price);

    let message = `📦 *${selectedItem.name}*\n`;
    if (selectedItem.description) message += `${selectedItem.description}\n`;
    message += `Precio: ${itemPrice}\n\n`;
    message += '¿Cuántas unidades deseas?\n\n*Responde con un número (1-10)*';

    return message;
  }

  return `❌ Opción no válida.\n\n${getItemsSelectionMessage(category)}`;
};

// Generar mensaje de opciones dinámicamente
function getItemsSelectionMessage({ emoji, name, items, footerInfo }: Category): string {
  let message = `${emoji} *${name}*\n\n`;

  items.forEach((item, index) => {
    message += `${numberToEmoji(index + 1)} ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (footerInfo) message += `\n${footerInfo}\n`;

  message += '\n*Elige un número*';
  return message;
}
