import type {
  CategorySelectionPropsFn,
  ItemSelectionPropsFn,
  MenuCategory,
} from '@/types/conversation';
import { formatPrice } from '@/utils/formatters';

// Manejar respuesta de selección de categoria
export const handleCategorySelection: CategorySelectionPropsFn = async ({
  message,
  categories,
  welcomeMessageFn,
  updateConversationFn,
}) => {
  console.log('🗃️ handleCategorySelection', message, categories);
  if (!Object.keys(categories).length) return welcomeMessageFn();

  const option = parseInt(message.trim());
  const categoriesKeys = Object.keys(categories); // Ej: ['desayunos', 'almuerzos']

  if (option >= 1 && option <= categoriesKeys.length) {
    const selectedCategoryKey: string = categoriesKeys[option - 1];
    await updateConversationFn(selectedCategoryKey);
    const selectedCategory = categories[selectedCategoryKey];
    console.log('🚀 ~ selectedCategoryKey:', selectedCategoryKey);

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
  console.log('⛏️ handleItemSelection:', message, category);
  if (!category && welcomeMessageFn()) return welcomeMessageFn();

  const option = parseInt(message.trim());

  if (option >= 1 && option <= category.items.length) {
    const selectedItem = category.items[option - 1];
    await updateConversationFn(option, selectedItem);
    const itemPrice = formatPrice(selectedItem.price);

    return `📦 *${selectedItem.name}*\n\nPrecio: ${itemPrice}\n\n¿Cuántas unidades deseas?\n\n*Responde con un número (1-10)*`;
  }

  return `❌ Opción no válida.\n\n${getItemsSelectionMessage(category)}`;
};

// Generar mensaje de opciones dinámicamente
function getItemsSelectionMessage({ emoji, name, items, footerInfo }: MenuCategory): string {
  let message = `${emoji} *${name}*\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}️⃣ ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (footerInfo) message += `\n${footerInfo}\n`;

  message += '\n*Elige un número*';
  return message;
}
