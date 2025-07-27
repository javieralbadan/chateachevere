import type {
  BaseConversation,
  CacheEntry,
  Conversation,
  InitialConvo,
  StepHandler,
} from '@/types/conversation';
import { kv } from '@vercel/kv';

const logModule = process.env.LOG_CORE_CONVO || false;
const localCache = new Map<string, CacheEntry<BaseConversation>>();

export function createConversationManager<T extends BaseConversation>(
  managerConfig: Conversation<T>,
) {
  const { config, stepHandlers } = managerConfig;
  const timeoutMs = config.timeoutMinutes * 60 * 1000; // Para validación (milisegundos)
  const timeoutSec = config.timeoutMinutes * 60; // Para KV (segundos)
  const getKey = (phoneNumber: string) => `${config.tenantId}-${phoneNumber}`;

  // **** Cache helpers ****

  const getFromCache = async (key: string): Promise<T | null> => {
    // Try local cache first
    const localEntry = localCache.get(key);
    if (localEntry && Date.now() < localEntry.expires) {
      if (logModule) console.log('📱 Local cache hit:', key);
      return localEntry.data as T;
    }

    // Remove expired entry
    if (localEntry) localCache.delete(key);

    // Try KV
    const kvData = await kv.get<T>(key);
    if (kvData) {
      if (logModule) console.log('🗄️ KV hit. Also caching locally:', key);
      localCache.set(key, { data: kvData, expires: Date.now() + timeoutMs });
    }

    return kvData;
  };

  const setToCache = async (key: string, data: T): Promise<void> => {
    data.lastInteraction = Date.now();

    // Save to both caches
    await kv.set(key, data, { ex: timeoutSec });
    localCache.set(key, { data, expires: Date.now() + timeoutMs });
  };

  const deleteFromCache = async (key: string): Promise<void> => {
    await kv.del(key);
    localCache.delete(key);
  };

  // **** Main functions ****

  // Obtener o crear conversación
  const getOrCreateConversation = async (
    phoneNumber: string,
    initialConversation: InitialConvo<T>,
  ): Promise<T> => {
    const key = getKey(phoneNumber);
    let conversation = await getFromCache(key);

    if (!conversation) {
      if (logModule) console.log('🆕 Create conversation for:', key);
      conversation = {
        key,
        lastInteraction: Date.now(),
        ...initialConversation,
      } as T;
    } else {
      if (logModule) console.log('🔄 Only update lastInteraction for:', key);
    }

    await setToCache(key, conversation);
    return conversation;
  };

  // Actualizar conversación
  const updateConversation = async (phoneNumber: string, updates: Partial<T>): Promise<void> => {
    const key = getKey(phoneNumber);
    if (logModule) console.log('📝 Updating conversation of:', key);

    const current = await getFromCache(key);
    if (!current) return;

    const updated = { ...current, ...updates };
    await setToCache(key, updated);

    if (logModule) console.log('📝 Updated conversation:', key, '▶️ currentStep:', updated.step);
  };

  // Limpiar conversación específica
  const clearConversation = async (phoneNumber: string): Promise<void> => {
    const key = getKey(phoneNumber);
    await deleteFromCache(key);
    if (logModule) console.log('🧹 Clear conversation of:', key);
  };

  // Verificar si hay una conversación activa
  const hasActiveConversation = async (phoneNumber: string): Promise<boolean> => {
    const conversation = await getFromCache(getKey(phoneNumber));
    if (!conversation) return false;

    const isExpired = Date.now() - conversation.lastInteraction > timeoutMs;
    if (isExpired) await clearConversation(phoneNumber);

    return !isExpired;
  };

  // Procesar mensaje principal
  const processMessage = async (
    phoneNumber: string,
    message: string,
    getInitialConversation: () => InitialConvo<T>,
    getWelcomeMessage: () => string,
  ): Promise<string> => {
    if (logModule) console.log('🚀 conversation processMessage:', { phoneNumber, message });

    const conversation = await getOrCreateConversation(phoneNumber, getInitialConversation());
    const isActive = await hasActiveConversation(phoneNumber);

    if (!isActive) {
      await clearConversation(phoneNumber);
      return getWelcomeMessage();
    }

    const handler = stepHandlers[conversation.step];
    if (!handler) {
      console.error(`❌ [Reiniciando] No hay handler para: ${conversation.step}`);
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
