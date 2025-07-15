import { kv } from '@vercel/kv';

const isDev = process.env.NODE_ENV === 'development';
type ConversationStep =
  | 'welcome' // Step para escoger categoría
  | 'category_selection' // Step genérico - escoger items de categoría -> first_level_selection
  | 'item_selection' // Step genérico - escoger items de categoría -> second_level_selection
  | 'quantity_selection'
  | 'cart_actions'
  | 'checkout'
  | 'final';

export interface ConversationConfig {
  timeoutMinutes: number;
}

export interface BaseConversation {
  phoneNumber: string;
  step: ConversationStep;
  lastInteraction: number;
}

export type StepHandler<T extends BaseConversation> = (
  phone: string,
  message: string,
  conversation: T,
) => Promise<string>;

export interface Conversation<T extends BaseConversation> {
  config: ConversationConfig;
  stepHandlers: Record<string, StepHandler<T>>;
}

export function createConversationManager<T extends BaseConversation>(
  managerConfig: Conversation<T>,
) {
  const { config, stepHandlers } = managerConfig;
  const conversationTimeout = config.timeoutMinutes * 60; // Para KV (segundos)
  const conversationTimeoutMs = config.timeoutMinutes * 60 * 1000; // Para validación (milisegundos)
  console.log('🚀 ~ conversationTimeout:', conversationTimeout);

  // Obtener o crear conversación
  const getOrCreateConversation = async (
    phoneNumber: string,
    initialConversation: Omit<T, 'phoneNumber' | 'lastInteraction'>,
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
    getInitialConversation: () => Omit<T, 'phoneNumber' | 'lastInteraction'>,
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
    return handler(phoneNumber, message, conversation);
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
