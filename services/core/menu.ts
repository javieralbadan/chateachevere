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

interface GenerateOptionsMessageProps {
  emoji: string;
  title: string;
  items: MenuItem[];
  additionalInfo?: string;
}

// Generar mensaje de opciones dinámicamente
export function generateOptionsMessage({
  emoji,
  title,
  items,
  additionalInfo,
}: GenerateOptionsMessageProps): string {
  let message = `${emoji} *${title}*\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}️⃣ ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (additionalInfo) {
    message += `\n${additionalInfo}\n`;
  }

  message += '\n*Elige un número*';
  return message;
}

// Manejar selección de items
interface HandleItemSelectionProps {
  message: string;
  category: MenuCategory;
  welcomeMessageFn: () => string;
  updateConversationFn: (option: number, selectedItem: MenuItem) => void;
}
export function handleItemSelection({
  message,
  category,
  welcomeMessageFn,
  updateConversationFn,
}: HandleItemSelectionProps): string {
  if (!category && welcomeMessageFn()) {
    return welcomeMessageFn();
  }

  const option = parseInt(message.trim());

  if (option >= 1 && option <= category.items.length) {
    const selectedItem = category.items[option - 1];
    updateConversationFn(option, selectedItem);

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
