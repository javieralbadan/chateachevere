import {
  Category,
  MenuItem,
  SequentialHandlersProps as Props,
  SequentialSelections,
  StepHandler,
} from '@/types/menu';
import { formatPrice, numberToEmoji } from '@/utils/formatters';

const logModule = process.env.LOG_CORE_MENU === 'true';

export const createSequentialHandlers = ({ tenantConfig, manager, customMessages }: Props) => {
  const config = tenantConfig;
  const sortedSteps = config.steps.sort((a, b) => a.order - b.order);

  // Handler para el mensaje de bienvenida secuencial [sequential_welcome]
  const welcome: StepHandler = async ({ phoneNumber, message }) => {
    const option = parseInt(message.trim(), 10);
    if (logModule) console.log('[sequential_welcome]:', option);

    if (option !== 1) {
      const conversation = await manager.getOrCreateConversation(phoneNumber, 'sequential_welcome');

      const hasItemsInCart = conversation.cart.length > 0;
      if (logModule) console.log('hasItemsInCart:', hasItemsInCart);

      // Repetir el mensaje secuencial de bienvenida o de añadir más items
      return hasItemsInCart
        ? customMessages.getRepeatFlowMessage()
        : customMessages.getWelcomeMessage();
    }

    await manager.updateConversation(phoneNumber, {
      step: 'sequential_step_selection',
      sequentialFlow: {
        currentStep: sortedSteps[0].order,
        selections: {},
      },
    });

    return getSequentialStepMessage(sortedSteps[0]);
  };

  // Handler para la selección en cada step secuencial [sequential_step_selection]
  const stepSelection: StepHandler = async ({ phoneNumber, message, conversation }) => {
    if (!conversation.sequentialFlow) {
      // Error: no debería llegar aquí sin flujo secuencial
      return customMessages.getWelcomeMessage('❌ Error en el flujo. Reiniciando...');
    }

    const option = parseInt(message.trim(), 10);
    if (logModule) console.log('[sequential_step_selection]:', option);
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

  // Función para completar el flujo secuencial y crear el CartItem
  async function completeSequentialFlow(
    phoneNumber: string,
    selections: SequentialSelections,
  ): Promise<string> {
    if (logModule) console.log('completeSequentialFlow selections:', selections);

    // Crear el nombre del item combinando todas las selecciones
    const selectionsValues = Object.values(selections);
    const itemNames = selectionsValues.map((sel) => sel.selectedItem.name);
    const itemFullName = itemNames.join(' + ');
    const price = selectionsValues.reduce((sum, sel) => sum + sel.selectedItem.price, 0);
    if (logModule) console.log('Precio total acumulado en el flujo actual:', price);

    await manager.updateConversation(phoneNumber, {
      step: 'quantity_selection',
      sequentialFlow: {
        currentStep: 0, // Reset step
        selections,
        customizedItem: { name: itemFullName, price },
      },
    });

    return getQuantityMessage(itemFullName, price);
  }

  return { welcome, stepSelection };
};

// ===== HELPERS =====

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

// Mostrar mensaje de cantidad
function getQuantityMessage(itemFullName: string, price: number): string {
  let message = `📦 *${itemFullName}*\n`;
  message += `Precio: ${formatPrice(price)}\n\n`;
  message += '¿Cuántos deseas?\n\n*Responde con un número (1-10)*';

  return message;
}
