import type { ConversationHandler, ConversationHandlerModule } from '@/types/conversation';
import * as carneBrava from '../carne-brava/conversation-handler';
import * as cheefoodies from '../cheefoodies/conversation-handler';
import { getHelpMessage, getInitialWelcomeMessage } from './custom-messages';

type TestTenantType = 'carne-brava' | 'cheefoodies';
const testTenants: Record<TestTenantType, ConversationHandlerModule> = {
  'carne-brava': carneBrava,
  cheefoodies,
};

const SYSTEM_KEYWORDS = {
  restart: ['reiniciar', 'reset', 'empezar'],
  help: ['ayuda', 'help', 'opciones'],
} as const;

// ===== Detecta qué tenant debe manejar el mensaje basado en palabras clave =====
function detectTenantFromMessage(message: string): TestTenantType | null {
  const lowerMessage = message.toLowerCase().trim();
  if (lowerMessage.includes('brava')) return 'carne-brava';
  if (lowerMessage.includes('domicilios')) return 'cheefoodies';
  return null;
}

// ===== Verifica si algún tenant tiene una conversación activa =====
async function getActiveTenant(phoneNumber: string): Promise<TestTenantType | null> {
  try {
    // Verificar conversaciones activas en paralelo
    const [isCarneBravaActive, isCheefoodiesActive] = await Promise.all([
      carneBrava.hasActiveConvo(phoneNumber),
      cheefoodies.hasActiveConvo(phoneNumber),
    ]);

    if (isCarneBravaActive) return 'carne-brava';
    if (isCheefoodiesActive) return 'cheefoodies';

    return null;
  } catch (error) {
    console.error('❌ Error verificando conversaciones activas:', error);
    return null;
  }
}

// ===== Limpia todas las conversaciones activas =====
async function clearAllConversations(phoneNumber: string): Promise<void> {
  try {
    await Promise.all([carneBrava.clearConvo(phoneNumber), cheefoodies.clearConvo(phoneNumber)]);
    console.log(`🧹 Conversaciones limpiadas para ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Error limpiando conversaciones:', error);
  }
}

// ===== Verifica si es una SYSTEM_KEYWORD =====
function isRestartMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return SYSTEM_KEYWORDS.restart.some((keyword) => lowerMessage.includes(keyword));
}

function isHelpMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return SYSTEM_KEYWORDS.help.some((keyword) => lowerMessage.includes(keyword));
}

// ===== Exportaciones para compatibilidad (aunque no se usen directamente) =====
export const hasActiveConvo = async (phone: string): Promise<boolean> => {
  const activeTenant = await getActiveTenant(phone);
  return activeTenant !== null;
};
export const clearConvo = async (phone: string) => await clearAllConversations(phone);

export const conversationHandler: ConversationHandler = async (phoneNumber, message) => {
  try {
    // Validación de entrada
    if (!phoneNumber || !message) {
      console.error('❌ phoneNumber o message vacío');
      return 'Error: Datos incompletos. Intenta nuevamente.';
    }

    const trimmedMessage = message.trim();
    console.log(`📱 Iniciando sandbox para ${phoneNumber}: "${trimmedMessage}"`);

    // Manejar comando de reinicio
    if (isRestartMessage(trimmedMessage)) {
      console.log('🔄 Reiniciando conversaciones...');
      await clearAllConversations(phoneNumber);
      return `✅ *Conversaciones reiniciadas*\n\n${getInitialWelcomeMessage()}`;
    }

    // Manejar solicitud de ayuda
    if (isHelpMessage(trimmedMessage)) {
      console.log('❓ Mostrando ayuda...');
      return getHelpMessage();
    }

    // Verificar si hay conversación activa
    const activeTenant = await getActiveTenant(phoneNumber);

    if (activeTenant) {
      console.log(`🔄 Continuando conversación activa con ${activeTenant}`);
      return await testTenants[activeTenant].conversationHandler(phoneNumber, trimmedMessage);
    }

    // Detectar tenant basado en el mensaje
    const detectedTenant = detectTenantFromMessage(trimmedMessage);

    if (detectedTenant) {
      console.log(`🎯 Iniciando nueva conversación con ${detectedTenant}`);
      return await testTenants[detectedTenant].conversationHandler(phoneNumber, trimmedMessage);
    }

    // Si no coincide con ningún tenant, mostrar opciones
    console.log('❔ Mensaje no reconocido, mostrando opciones');
    return getInitialWelcomeMessage();
  } catch (error) {
    console.error('❌ Error en conversationHandler:', error);

    // Limpiar conversaciones en caso de error crítico
    try {
      await clearAllConversations(phoneNumber);
    } catch (clearError) {
      console.error('❌ Error adicional limpiando conversaciones:', clearError);
    }

    return `❌ *Error del sistema*\n\nOcurrió un problema inesperado. Las conversaciones han sido reiniciadas.\n\n${getInitialWelcomeMessage()}`;
  }
};
