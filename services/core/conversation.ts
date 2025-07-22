import type {
  BaseConversation,
  Conversation,
  InitialConvo,
  StepHandler,
} from '@/types/conversation';
import { kv } from '@vercel/kv';

const isDev = process.env.NODE_ENV === 'development';

export function createConversationManager<T extends BaseConversation>(
  managerConfig: Conversation<T>,
) {
  const { config, stepHandlers } = managerConfig;
  const conversationTimeout = config.timeoutMinutes * 60; // Para KV (segundos)
  const conversationTimeoutMs = config.timeoutMinutes * 60 * 1000; // Para validación (milisegundos)

  // Obtener o crear conversación
  const getOrCreateConversation = async (
    phoneNumber: string,
    initialConversation: InitialConvo<T>,
  ): Promise<T> => {
    let conversation = await kv.get<T>(phoneNumber);

    if (!conversation) {
      conversation = {
        phoneNumber,
        lastInteraction: Date.now(),
        ...initialConversation,
      } as T;

      console.log('🆕 Create conversation for:', phoneNumber);
      await kv.set(phoneNumber, conversation, { ex: conversationTimeout });
    } else {
      console.log('🔄 Update lastInteraction for:', phoneNumber);
      conversation.lastInteraction = Date.now();
      await kv.set(phoneNumber, conversation, { ex: conversationTimeout });
    }

    return conversation;
  };

  // Actualizar conversación
  const updateConversation = async (phoneNumber: string, updates: Partial<T>): Promise<void> => {
    console.log('📝 Update conversation of:', phoneNumber);
    const currentConvo = await kv.get<T>(phoneNumber);
    if (!currentConvo) return;

    const mergedConvo = {
      ...currentConvo,
      ...updates,
      lastInteraction: Date.now(),
    };

    await kv.set(phoneNumber, mergedConvo, { ex: conversationTimeout });

    if (isDev) {
      console.log('▶️ currentStep:', mergedConvo.step);
      console.log('currentConversation:', mergedConvo);
    }
  };

  // Limpiar conversación específica
  const clearConversation = async (phone: string): Promise<void> => {
    console.log('🧹 Clear conversation of:', phone);
    await kv.del(phone);
  };

  // Verificar si hay una conversación activa
  const hasActiveConversation = async (phoneNumber: string): Promise<boolean> => {
    const conv = await kv.get<T>(phoneNumber);

    if (!conv) {
      console.log('🧲 conversation isActive? -> no conversation');
      return false;
    }

    const now = Date.now();
    const timeSinceLastInteraction = now - conv.lastInteraction;

    console.log('🚀 ~ hasActiveConversation ~ timeSinceLastInteraction:', timeSinceLastInteraction);
    console.log('🚀 ~ hasActiveConversation ~ conversationTimeout:', conversationTimeout);
    const isExpired = timeSinceLastInteraction > conversationTimeoutMs;

    console.log('🧲 conversation isActive? isExpired:', isExpired);
    return !isExpired;
  };

  // Procesar mensaje principal
  const processMessage = async (
    phoneNumber: string,
    message: string,
    getInitialConversation: () => InitialConvo<T>,
    getWelcomeMessage: () => string,
  ): Promise<string> => {
    console.log('🚀 conversation processMessage:', { phoneNumber, message });
    const conversation = await getOrCreateConversation(phoneNumber, getInitialConversation());
    const isActive = await hasActiveConversation(phoneNumber);

    if (!isActive) {
      await clearConversation(phoneNumber);
      return getWelcomeMessage();
    }

    if (isDev) console.log('🚀 step:', conversation.step);
    const handler = stepHandlers[conversation.step];
    if (!handler) {
      console.error(`❌ Reiniciar conversación. No hay handler. Step: ${conversation.step}`);
      await clearConversation(phoneNumber);
      return getWelcomeMessage();
    }

    // Llamamos siempre con los tres parámetros
    return handler({ phoneNumber, message, conversation });
  };

  // Registrar nuevo step handler
  const registerStepHandler = (step: string, handler: StepHandler<T>): void => {
    stepHandlers[step] = handler;
  };

  // Retornar todas las funciones del manager
  return {
    getOrCreateConversation,
    updateConversation,
    clearConversation,
    hasActiveConversation,
    processMessage,
    registerStepHandler,
  };
}
