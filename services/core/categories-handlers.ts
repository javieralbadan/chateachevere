import { Category, MenuItem, CategoriesHandlersProps as Props, StepHandler } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';

const logModule = process.env.LOG_CORE_MENU === 'true';

export const createCategoriesHandlers = ({ tenantConfig, manager, customMessages }: Props) => {
  const config = tenantConfig;

  // Handler para el mensaje de bienvenida [category_welcome]
  const welcome: StepHandler = async ({ phoneNumber, message }) => {
    if (logModule) console.log('[category_welcome]:', message);
    await manager.updateConversation(phoneNumber, {
      step: 'category_selection',
    });
    return customMessages.getWelcomeMessage();
  };

  // Handler para selección de categoría [category_selection]
  const categorySelection: StepHandler = async ({ phoneNumber, message }) => {
    if (!Object.keys(config.categories).length) return customMessages.getWelcomeMessage();

    const option = parseInt(message.trim(), 10);
    const categoriesKeys = Object.keys(config.categories);

    if (logModule) console.log('[category_selection]:', option, categoriesKeys);

    if (isNaN(option) || option < 1 || option > categoriesKeys.length) {
      const conversation = await manager.getOrCreateConversation(phoneNumber, 'category_welcome');

      const hasItemsInCart = conversation.cart.length > 0;
      if (logModule) console.log('hasItemsInCart:', hasItemsInCart);

      // Repetir el mensaje de bienvenida o de añadir más items
      return hasItemsInCart
        ? customMessages.getRepeatFlowMessage()
        : customMessages.getWelcomeMessage();
    }

    const selectedCategoryKey = categoriesKeys[option - 1];
    const selectedCategory = config.categories[selectedCategoryKey];

    await manager.updateConversation(phoneNumber, {
      step: 'item_selection',
      selectedCategory: selectedCategoryKey,
    });

    if (logModule) console.log('Selected category:', selectedCategoryKey);
    return getItemsSelectionMessage(selectedCategory);
  };

  // Handler para selección de item [item_selection]
  const itemSelection: StepHandler = async ({ phoneNumber, message, conversation }) => {
    if (!Object.keys(config.categories).length) return customMessages.getWelcomeMessage();
    if (!conversation.selectedCategory) {
      return customMessages.getWelcomeMessage('❌ Error: no hay categoría seleccionada.');
    }

    const category = config.categories[conversation.selectedCategory];
    if (!category) {
      return customMessages.getWelcomeMessage('❌ Error: categoría no encontrada.');
    }

    const option = parseInt(message.trim(), 10);

    if (logModule) console.log('[itemSelection]:', option, category.name);

    if (isNaN(option) || option < 1 || option > category.items.length) {
      return `❌ Opción no válida.\n\n${getItemsSelectionMessage(category)}`;
    }

    const selectedItem = category.items[option - 1];
    if (logModule) console.log('selectedItem:', selectedItem);

    await manager.updateConversation(phoneNumber, {
      step: 'quantity_selection',
      selectedItem,
    });

    return getQuantityMessage(selectedItem);
  };

  return { welcome, categorySelection, itemSelection };
};

// ===== HELPERS =====

function getItemsSelectionMessage({ emoji, name, items, footerInfo }: Category): string {
  let message = `${emoji} *${name}*\n\n`;

  items.forEach((item, index) => {
    message += `${numberToEmoji(index + 1)} ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (footerInfo) message += `\n${footerInfo}\n`;
  message += '\n*Elige un número*';

  return message;
}

// Mostrar mensaje de cantidad
function getQuantityMessage({ name, description, price }: MenuItem): string {
  let message = `📦 *${name}*\n`;
  if (description) message += `${description}\n`;
  message += `Precio: ${formatPrice(price)}\n\n`;
  message += '¿Cuántas unidades deseas?\n\n*Responde con un número (1-10)*';

  return message;
}
