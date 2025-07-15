import { formatPrice } from '../utils';

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface MenuCategory {
  name: string;
  emoji: string;
  items: MenuItem[];
  includes?: string;
}

// TODO: Incluir opcion "salir" para volver al menu inicial, reset all
interface HandleCategorySelectionProps {
  message: string;
  categories: Record<string, MenuCategory>;
  welcomeMessageFn: (msgPreliminar?: string) => string;
  updateConversationFn: (selectedCategoryKey: string) => Promise<void>;
}
// Manejar respuesta de selección de categoria
export async function handleCategorySelection({
  message,
  categories,
  welcomeMessageFn,
  updateConversationFn,
}: HandleCategorySelectionProps): Promise<string> {
  console.log('🗃️ handleCategorySelection', message, categories);
  if (!Object.keys(categories).length) {
    return welcomeMessageFn();
  }

  const option = parseInt(message.trim());
  const categoriesKeys = Object.keys(categories); // ['desayunos', 'almuerzos']

  if (option >= 1 && option <= categoriesKeys.length) {
    const selectedCategoryKey: string = categoriesKeys[option - 1];
    await updateConversationFn(selectedCategoryKey);

    console.log('🚀 ~ selectedCategoryKey:', selectedCategoryKey);
    const selectedCategory = categories[selectedCategoryKey];
    // Generar información adicional de la categoria
    let additionalInfo = '';
    if (selectedCategory.includes) {
      // TODO: Move this to restaurant handler
      additionalInfo = `*Todos incluyen:* ${selectedCategory.includes}`;
    }

    return generateOptionsMessage({
      emoji: selectedCategory.emoji,
      title: selectedCategory.name,
      items: selectedCategory.items,
      additionalInfo: additionalInfo,
    });
  }

  return welcomeMessageFn(option ? '❌ Opción no válida.' : '');
}

interface GenerateOptionsMessageProps {
  emoji: string;
  title: string;
  items: MenuItem[];
  additionalInfo?: string;
}

// Generar mensaje de opciones dinámicamente
function generateOptionsMessage({
  emoji,
  title,
  items,
  additionalInfo,
}: GenerateOptionsMessageProps): string {
  let message = `${emoji} *${title}*\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}️⃣ ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (additionalInfo) message += `\n${additionalInfo}\n`;

  message += '\n*Elige un número*';
  return message;
}

// Manejar selección de items
interface HandleItemSelectionProps {
  message: string;
  category: MenuCategory;
  welcomeMessageFn: () => string;
  updateConversationFn: (option: number, selectedItem: MenuItem) => Promise<void>;
}
export async function handleItemSelection({
  message,
  category,
  welcomeMessageFn,
  updateConversationFn,
}: HandleItemSelectionProps): Promise<string> {
  console.log('⛏️ handleItemSelection:', message, category);
  if (!category && welcomeMessageFn()) {
    return welcomeMessageFn();
  }

  const option = parseInt(message.trim());

  if (option >= 1 && option <= category.items.length) {
    const selectedItem = category.items[option - 1];
    await updateConversationFn(option, selectedItem);

    return getQuantitySelectionMessage(selectedItem.name, selectedItem.price);
  }

  const additionalInfo = category.includes ? `*Todos incluyen:* ${category.includes}` : '';
  return `❌ Opción no válida.\n\n${generateOptionsMessage({
    emoji: category.emoji,
    title: category.name,
    items: category.items,
    additionalInfo: additionalInfo,
  })}`;
}

// Mensaje de selección de cantidad
function getQuantitySelectionMessage(itemName: string, itemPrice: number): string {
  return `📦 *${itemName}*
Precio: ${formatPrice(itemPrice)}

¿Cuántas unidades deseas?

*Responde con un número (1-10)*`;
}
