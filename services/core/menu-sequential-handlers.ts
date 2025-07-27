import type {
  CartConversation,
  ConversationManager,
  InitialConvo,
  SequentialSelection,
  TenantHandler,
} from '@/types/conversation';
import { Category, MenuItem, SequentialFlowConfig, TenantConfig } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';
import { getWelcomeMessage } from '../tenants/carne-brava/custom-messages';
import { getCartActionsMessage } from './cart';

export const createSequentialHandlers = (
  tenantConfig: TenantConfig,
  manager: ConversationManager<CartConversation>,
  getInitialConversation: () => InitialConvo<CartConversation>,
) => {
  const config = tenantConfig as SequentialFlowConfig;
  // Handler para el mensaje de bienvenida secuencial
  const handleSequentialWelcomeResponse: TenantHandler = async ({ phoneNumber }) => {
    // Ordenar las etapas por el atributo "orden"
    const sortedSteps = config.steps.sort((a, b) => a.order - b.order);

    await manager.updateConversation(phoneNumber, {
      step: 'sequential_step_selection',
      sequentialFlow: {
        currentStep: sortedSteps[0].order, // Empezar con el primer step
        selections: {},
      },
    });

    return getSequentialStepMessage(sortedSteps[0]);
  };

  // Handler para la selección en cada step secuencial
  const handleSequentialStepSelectionResponse: TenantHandler = async ({
    phoneNumber,
    message,
    conversation,
  }) => {
    const option = parseInt(message.trim(), 10);

    if (!conversation.sequentialFlow) {
      // Error: no debería llegar aquí sin flujo secuencial
      return getWelcomeMessage('❌ Error en el flujo. Reiniciando...');
    }

    // Encontrar el step actual
    const currentStep = config.steps.find(
      (step) => step.order === conversation.sequentialFlow!.currentStep,
    );

    if (!currentStep) {
      return getWelcomeMessage('❌ Error en el flujo. Reiniciando...');
    }

    // Validar opción
    if (option < 1 || option > currentStep.items.length) {
      return `❌ Opción no válida.\n\n${getSequentialStepMessage(currentStep)}`;
    }

    // Guardar selección
    const selectedItem = currentStep.items[option - 1];
    const updatedSelections = {
      ...conversation.sequentialFlow.selections,
      [currentStep.name]: {
        stepName: currentStep.name,
        selectedItem: {
          name: selectedItem.name,
          price: selectedItem.price,
        },
      },
    };

    // Verificar si hay más steps
    const sortedSteps = config.steps.sort((a, b) => a.order - b.order);
    const currentStepIndex = sortedSteps.findIndex(
      (step) => step.order === conversation.sequentialFlow!.currentStep,
    );
    const isLastStep = currentStepIndex === sortedSteps.length - 1;

    if (isLastStep) {
      // Completar el almuerzo y agregarlo al carrito
      return await completeSequentialFlow(phoneNumber, updatedSelections);
    } else {
      // Continuar al siguiente step
      const nextStep = sortedSteps[currentStepIndex + 1];
      await manager.updateConversation(phoneNumber, {
        sequentialFlow: {
          currentStep: nextStep.order,
          selections: updatedSelections,
        },
      });

      return getSequentialStepMessage(nextStep);
    }
  };

  // Función para generar el mensaje de cada step secuencial
  function getSequentialStepMessage(step: Category): string {
    let message = `${step.emoji} *${step.name}*\n\n`;

    step.items.forEach((item: MenuItem, index: number) => {
      const priceText = item.price > 0 ? ` - ${formatPrice(item.price)}` : '';
      message += `${numberToEmoji(index + 1)} ${item.name}${priceText}\n`;
    });

    if (step.footerInfo) {
      message += `\n${step.footerInfo}\n`;
    }

    message += '\n*Elige un número*';
    return message;
  }

  // Función para completar el flujo secuencial y crear el CartItem
  async function completeSequentialFlow(
    phoneNumber: string,
    selections: Record<string, SequentialSelection>,
  ): Promise<string> {
    // Crear el nombre del almuerzo combinando todas las selecciones
    const itemNames = Object.values(selections).map(
      (sel: SequentialSelection) => sel.selectedItem.name,
    );
    const lunchName = itemNames.join(' + ');

    // Calcular el precio total sumando todos los precios
    const totalPrice = Object.values(selections).reduce((sum: number, sel: SequentialSelection) => {
      return sum + sel.selectedItem.price;
    }, 0);

    // Crear el CartItem para el almuerzo completo
    const lunchItem = {
      name: lunchName,
      quantity: 1,
      price: totalPrice,
      category: 'almuerzo_completo',
      itemIndex: 0,
    };

    // Obtener conversación actual y agregar al carrito
    const conversation = await manager.getOrCreateConversation(
      phoneNumber,
      getInitialConversation(),
    );

    const updatedCart = [...conversation.cart, lunchItem];

    // Actualizar conversación al step de cart_actions y limpiar sequentialFlow
    await manager.updateConversation(phoneNumber, {
      step: 'cart_actions',
      cart: updatedCart,
      sequentialFlow: undefined, // Limpiar el flujo secuencial
    });

    return getCartActionsMessage(updatedCart, tenantConfig.deliveryCost);
  }

  return { handleSequentialWelcomeResponse, handleSequentialStepSelectionResponse };
};
