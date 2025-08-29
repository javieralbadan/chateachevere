import {
  Category,
  CompleteCustomizationFn,
  CustomizableCategory,
  CustomizableMenuItem,
  MenuItem,
  CategoriesHandlersProps as Props,
  StepHandler,
} from '@/types/menu';
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

    // ===== CUSTOMIZABLE ITEM =====
    const customizableSelectedItem = selectedItem as CustomizableMenuItem;
    if (customizableSelectedItem?.customizationSteps?.length) {
      if (logModule) console.log('Iniciando flujo de personalización de ítem');

      const sortedSteps = customizableSelectedItem.customizationSteps.sort(
        (a, b) => a.order - b.order,
      );
      const firstStep = sortedSteps[0];

      await manager.updateConversation(phoneNumber, {
        step: 'item_customization',
        customizationFlow: {
          currentStep: firstStep.order,
          selections: {},
          baseItem: {
            name: customizableSelectedItem.name,
            price: customizableSelectedItem.price,
            description: customizableSelectedItem.description,
          },
        },
      });

      return getCustomizableCategoryMessage(firstStep, customizableSelectedItem);
    }

    await manager.updateConversation(phoneNumber, {
      step: 'quantity_selection',
      selectedItem,
    });

    return getQuantityMessage(selectedItem);
  };

  // Handler para personalización de items [item_customization]
  const itemCustomization: StepHandler = async ({ phoneNumber, message, conversation }) => {
    if (!conversation.customizationFlow) {
      return customMessages.getWelcomeMessage('⚠ Error en flujo de personalización. Reiniciando!');
    }

    const option = parseInt(message.trim(), 10);
    if (logModule) console.log('[item_customization]:', option);

    const { customizationFlow } = conversation;

    // Get current step info from the selected item
    const currentCategory = config.categories[conversation.selectedCategory!];
    const selectedItem = currentCategory.items.find(
      (item) => item.name === customizationFlow.baseItem.name,
    ) as CustomizableMenuItem;

    if (!selectedItem?.customizationSteps) {
      return customMessages.getWelcomeMessage('⚠ Error: config de personalización no encontrada');
    }

    const currentStepConfig = selectedItem.customizationSteps.find(
      (step) => step.order === customizationFlow.currentStep,
    );

    if (!currentStepConfig) {
      return customMessages.getWelcomeMessage('⚠ Error: paso de personalización no encontrado');
    }

    // Validate option
    if (isNaN(option) || option < 1 || option > currentStepConfig.options.length) {
      return `⚠ Opción no válida.\n\n${getCustomizableCategoryMessage(currentStepConfig, selectedItem)}`;
    }

    const selectedOption = currentStepConfig.options[option - 1];
    if (logModule) console.log('Opción personalizada seleccionada:', selectedOption);

    const updatedSelections = {
      ...customizationFlow.selections,
      [currentStepConfig.name]: selectedOption,
    };

    // Check if there are more steps
    const sortedSteps = selectedItem.customizationSteps.sort((a, b) => a.order - b.order);
    const currentStepIndex = sortedSteps.findIndex(
      (step) => step.order === customizationFlow.currentStep,
    );
    const isLastStep = currentStepIndex === sortedSteps.length - 1;

    if (isLastStep) {
      if (logModule) console.log('Personalización finalizada. Creando el item final');

      return await completeCustomization({
        phoneNumber,
        selections: updatedSelections,
        baseItem: customizationFlow.baseItem,
      });
    } else {
      const nextStep = sortedSteps[currentStepIndex + 1];
      await manager.updateConversation(phoneNumber, {
        customizationFlow: {
          ...customizationFlow,
          currentStep: nextStep.order,
          selections: updatedSelections,
        },
      });

      return getCustomizableCategoryMessage(nextStep, selectedItem);
    }
  };

  // ===== CLOSURE HELPERS =====

  const completeCustomization: CompleteCustomizationFn = async ({
    phoneNumber,
    selections,
    baseItem,
  }) => {
    if (logModule) console.log('[completeCustomization] selections:', selections);

    // Build customized item name
    const customizationTexts = Object.values(selections).map((option: MenuItem) => option.name);
    const customizedName = `${baseItem.name} (${customizationTexts.join(', ')})`;

    // Calculate total price (base + customization modifiers)
    const customizationPrice = Object.values(selections).reduce(
      (sum: number, option: MenuItem) => sum + (option.price || 0),
      0,
    );
    const totalPrice = baseItem.price + customizationPrice;

    const customizedItem: MenuItem = {
      name: customizedName,
      price: totalPrice,
      description: baseItem.description,
    };

    if (logModule) console.log('>>> Final customized item:', customizedItem);

    await manager.updateConversation(phoneNumber, {
      step: 'quantity_selection',
      selectedItem: customizedItem,
      customizationFlow: undefined, // Clear customization flow
    });

    return getQuantityMessage(customizedItem);
  };

  function getItemsSelectionMessage(category: Category): string {
    return customMessages.getItemsSelectionMessage
      ? customMessages.getItemsSelectionMessage(category)
      : defaultItemsSelectionMessage(category);
  }

  function getCustomizableCategoryMessage(
    step: CustomizableCategory,
    baseItem: CustomizableMenuItem,
  ): string {
    return customMessages.getCustomizableCategoryMessage
      ? customMessages.getCustomizableCategoryMessage(step, baseItem)
      : defaultCustomizableCategoryMessage(step, baseItem);
  }

  function getQuantityMessage(menuItem: MenuItem): string {
    return customMessages.getQuantityMessage
      ? customMessages.getQuantityMessage(menuItem)
      : defaultQuantityMessage(menuItem);
  }

  return {
    welcome,
    categorySelection,
    itemSelection,
    itemCustomization,
  };
};

// ===== DEFAULT MESSAGES =====

function defaultItemsSelectionMessage({ emoji, name, items, footerInfo }: Category): string {
  let message = `${emoji} *${name}*\n\n`;

  items.forEach((item, index) => {
    message += `${numberToEmoji(index + 1)} ${item.name} - ${formatPrice(item.price)}\n`;
  });

  if (footerInfo) message += `\n${footerInfo}\n`;
  message += '\n*Elige un número*';

  return message;
}

function defaultCustomizableCategoryMessage(
  step: CustomizableCategory,
  baseItem: CustomizableMenuItem,
): string {
  let message = `${step.emoji} *${step.name}*\n`;
  message += `_${baseItem.description}_\n\n`;

  step.options.forEach((option: MenuItem, index: number) => {
    const priceText = option.price > 0 ? ` (+${formatPrice(option.price)})` : '';
    message += `${numberToEmoji(index + 1)} ${option.name}${priceText}\n`;
  });

  if (step.footerInfo) message += `\n${step.footerInfo}\n`;
  message += '\n*Elige un número*';

  return message;
}

function defaultQuantityMessage({ name, description, price }: MenuItem): string {
  let message = `📦 *${name}*\n`;
  if (description) message += `${description}\n`;
  message += `Precio: ${formatPrice(price)}\n\n`;
  message += '¿Cuántas unidades deseas?\n\n*Responde con un número (1-10)*';

  return message;
}
