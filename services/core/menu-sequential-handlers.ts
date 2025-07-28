import type {
  CartConversation,
  ConversationManager,
  InitialConvo,
  SequentialSelection,
  TenantHandler,
} from '@/types/conversation';
import { Category, MenuItem, SequentialFlowConfig, TenantConfig } from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';
import { handleQuantitySelection } from './cart';

const logModule = process.env.LOG_CORE_MENU === 'true';
interface Props {
  tenantConfig: TenantConfig;
  manager: ConversationManager<CartConversation>;
  getInitialConversation: () => InitialConvo<CartConversation>;
  customMessages: Record<string, (props?: string) => string>;
}

export const createSequentialHandlers = ({
  tenantConfig,
  manager,
  getInitialConversation,
  customMessages,
}: Props) => {
  const config = tenantConfig as SequentialFlowConfig;
  // Handler para el mensaje de bienvenida secuencial
  const handleSequentialWelcomeResponse: TenantHandler = async ({ phoneNumber, message }) => {
    const option = parseInt(message.trim(), 10);

    if (option !== 1) {
      const conversation = await manager.getOrCreateConversation(
        phoneNumber,
        getInitialConversation(),
      );

      const hasItemsInCart = conversation.cart.length > 0;
      if (logModule) console.log('hasItemsInCart:', hasItemsInCart);

      // Repetir el mensaje secuencial de bienvenida o de añadir más items
      return hasItemsInCart
        ? customMessages.getSequentialAddMoreItemsMessage()
        : customMessages.getSequentialWelcomeMessage();
    }

    if (logModule) console.log('handleSequentialWelcomeResponse:', option);
    const sortedSteps = config.steps.sort((a, b) => a.order - b.order);

    await manager.updateConversation(phoneNumber, {
      step: 'sequential_step_selection',
      sequentialFlow: {
        currentStep: sortedSteps[0].order,
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
    if (!conversation.sequentialFlow) {
      // Error: no debería llegar aquí sin flujo secuencial
      return customMessages.getWelcomeMessage('❌ Error en el flujo. Reiniciando...');
    }

    const option = parseInt(message.trim(), 10);
    if (logModule) console.log('handleSequentialStepSelectionResponse:', option);
    // Encontrar el step actual
    const currentStep = config.steps.find(
      (step) => step.order === conversation.sequentialFlow!.currentStep,
    );

    if (!currentStep) {
      return customMessages.getWelcomeMessage('❌ Error en el flujo. Reiniciando...');
    }

    // Validar opción
    if (option < 1 || option > currentStep.items.length) {
      return `❌ Opción no válida.\n\n${getSequentialStepMessage(currentStep)}`;
    }

    const selectedItem = currentStep.items[option - 1];
    if (logModule) console.log('Guardar selección:', selectedItem);
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

    if (logModule) console.log('updatedSelections:', updatedSelections);

    // Verificar si hay más steps
    const sortedSteps = config.steps.sort((a, b) => a.order - b.order);
    const currentStepIndex = sortedSteps.findIndex(
      (step) => step.order === conversation.sequentialFlow!.currentStep,
    );
    const isLastStep = currentStepIndex === sortedSteps.length - 1;

    if (isLastStep) {
      if (logModule) console.log('(isLastStep) Completar flujo secuencial');
      return await completeSequentialFlow(phoneNumber, updatedSelections);
    } else {
      if (logModule) console.log('Continuando al siguiente step');
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

    if (step.footerInfo) message += `\n${step.footerInfo}\n`;

    message += '\n*Elige un número*';
    return message;
  }

  // Función para completar el flujo secuencial y crear el CartItem
  async function completeSequentialFlow(
    phoneNumber: string,
    selections: Record<string, SequentialSelection>,
  ): Promise<string> {
    if (logModule) console.log('completeSequentialFlow selections:', selections);

    // Crear el nombre del item combinando todas las selecciones
    // TODO: extract Object.values(selections)
    const selectionsValues = Object.values(selections);
    const itemNames = selectionsValues.map((sel) => sel.selectedItem.name);
    const itemFullName = itemNames.join(' + ');
    const price = selectionsValues.reduce((sum, sel) => sum + sel.selectedItem.price, 0);
    if (logModule) console.log('Precio total acumulado en el flujo actual:', price);

    // Actualizar conversación al step de sequential_quantity_selection
    await manager.updateConversation(phoneNumber, {
      step: 'sequential_quantity_selection',
      sequentialFlow: {
        currentStep: 0, // Reset step
        selections,
        customizedItem: { name: itemFullName, price },
      },
    });

    // Mostrar mensaje de cantidad
    let message = `📦 *${itemFullName}*\n`;
    message += `Precio: ${formatPrice(price)}\n\n`;
    message += '¿Cuántos deseas?\n\n*Responde con un número (1-10)*';

    return message;
  }

  const handleSequentialQuantitySelectionResponse: TenantHandler = async ({
    phoneNumber,
    message,
    conversation,
  }) => {
    if (!conversation.sequentialFlow?.customizedItem) {
      return customMessages.getWelcomeMessage('❌ Error en el flujo. Reiniciando...');
    }

    if (logModule) console.log('🧮 handleResponse [sequential_quantity_selection]');
    return handleQuantitySelection({
      conversation,
      quantity: parseInt(message.trim(), 10),
      price: conversation.sequentialFlow.customizedItem.price,
      deliveryCost: tenantConfig.deliveryCost,
      updateConversationFn: (updatedCart) =>
        // Actualizar conversación al step de cart_actions y limpiar sequentialFlow
        manager.updateConversation(phoneNumber, {
          step: 'cart_actions',
          cart: updatedCart,
          sequentialFlow: undefined,
        }),
    });
  };

  return {
    handleSequentialWelcomeResponse,
    handleSequentialStepSelectionResponse,
    handleSequentialQuantitySelectionResponse,
  };
};
