import type {
  CacheEntry,
  CartConversation,
  ClearConversationFn,
  ConversationManager,
  ConvoBaseConfig,
  ConvoConfig,
  GetOrCreateConversationFn,
  HasActiveConversationFn,
  ProcessMessageFn,
  RegisterHandlerFn,
  UpdateConversationFn,
} from '@/types/conversation';
import { kv } from '@vercel/kv';

const logModule = process.env.LOG_CORE_CONVO === 'true';
const localCache = new Map<string, CacheEntry>();

export function createConversationManager(initialConfig: ConvoBaseConfig): ConversationManager {
  const managerConfig: ConvoConfig = {
    ...initialConfig,
    stepHandlers: {},
  };
  const timeoutMs = managerConfig.timeoutMinutes * 60 * 1000; // Para validación (milisegundos)
  const timeoutSec = managerConfig.timeoutMinutes * 60; // Para KV (segundos)
  const getKey = (phoneNumber: string) => `${managerConfig.tenantId}-${phoneNumber}`;

  // ===== CACHE HELPERS =====

  const getFromCache = async (key: string): Promise<CartConversation | null> => {
    // Try local cache first
    const localEntry = localCache.get(key);
    if (localEntry && Date.now() < localEntry.expires) {
      if (logModule) console.log('📱 Local cache hit:', key);
      return localEntry.data;
    }

    // Remove expired entry
    if (localEntry) localCache.delete(key);

    // Try KV
    const kvData = await kv.get<CartConversation>(key);
    if (kvData) {
      if (logModule) console.log('🗄️ KV hit. Also caching locally:', key);
      localCache.set(key, { data: kvData, expires: Date.now() + timeoutMs });
    }

    return kvData;
  };

  const setToCache = async (key: string, data: CartConversation): Promise<void> => {
    data.lastInteraction = Date.now();

    // Save to both caches
    await kv.set(key, data, { ex: timeoutSec });
    localCache.set(key, { data, expires: Date.now() + timeoutMs });
  };

  const deleteFromCache = async (key: string): Promise<void> => {
    await kv.del(key);
    localCache.delete(key);
  };

  // ===== MAIN FUNCTIONS =====

  // Obtener o crear conversación
  const getOrCreateConversation: GetOrCreateConversationFn = async (phoneNumber, initialStep) => {
    const key = getKey(phoneNumber);
    let conversation = await getFromCache(key);

    if (!conversation) {
      if (logModule) console.log('🆕 Create conversation for:', key);
      conversation = {
        key,
        lastInteraction: Date.now(),
        step: initialStep,
        cart: [],
      } as CartConversation;
    } else {
      if (logModule) console.log('🔄 Only update lastInteraction for:', key);
    }

    await setToCache(key, conversation);
    return conversation;
  };

  // Actualizar conversación
  const updateConversation: UpdateConversationFn = async (phoneNumber, updates) => {
    const key = getKey(phoneNumber);
    if (logModule) console.log('📝 Updating conversation of:', key);

    const current = await getFromCache(key);
    if (!current) return;

    const updated = { ...current, ...updates };
    await setToCache(key, updated);

    if (logModule) console.log('📝 Updated conversation:', key, '▶️ currentStep:', updated.step);
  };

  // Limpiar conversación específica
  const clearConversation: ClearConversationFn = async (phoneNumber) => {
    const key = getKey(phoneNumber);
    await deleteFromCache(key);
    if (logModule) console.log('🧹 Clear conversation of:', key);
  };

  // Verificar si hay una conversación activa
  const hasActiveConversation: HasActiveConversationFn = async (phoneNumber) => {
    const conversation = await getFromCache(getKey(phoneNumber));
    if (!conversation) return false;

    const isExpired = Date.now() - conversation.lastInteraction > timeoutMs;
    if (isExpired) await clearConversation(phoneNumber);

    return !isExpired;
  };

  // Procesar mensaje principal
  const processMessage: ProcessMessageFn = async (phoneNumber, message, getWelcomeMessage) => {
    if (logModule) console.log('conversation processMessage:', { phoneNumber, message });

    const isSequentialConvo = managerConfig.flowType === 'sequential';
    const initialStep = isSequentialConvo ? 'sequential_welcome' : 'category_welcome';
    const conversation = await getOrCreateConversation(phoneNumber, initialStep);
    const isActive = await hasActiveConversation(phoneNumber);

    if (!isActive) {
      await clearConversation(phoneNumber);
      return getWelcomeMessage();
    }

    const handler = managerConfig.stepHandlers[conversation.step];
    if (!handler) {
      console.error(`❌ [Reiniciando] No hay handler para: ${conversation.step}`);
      await clearConversation(phoneNumber);
      return getWelcomeMessage();
    }

    // Llamamos siempre con los tres parámetros
    if (logModule) console.log('Llamando handler:', conversation.step);
    return handler({ phoneNumber, message, conversation });
  };

  // Registrar nuevo step handler
  const registerHandler: RegisterHandlerFn = (step, handler) => {
    managerConfig.stepHandlers[step] = handler;
  };

  // Retornar todas las funciones del manager
  return {
    getOrCreateConversation,
    updateConversation,
    clearConversation,
    hasActiveConversation,
    processMessage,
    registerHandler,
  };
}

// ===== TESTING HELPERS =====

export function clearLocalCache() {
  localCache.clear();
}
