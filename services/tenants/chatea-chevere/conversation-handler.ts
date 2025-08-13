import { handleAdminCommand } from '@/services/core/admin';
import type { ConversationHandler, ConversationHandlerModule } from '@/types/conversation';
import * as carneBrava from '../carne-brava/conversation-handler';
import * as cheefoodies from '../cheefoodies/conversation-handler';
import { getHelpMessage, getInitialWelcomeMessage } from './custom-messages';

type TestTenantType = 'carne-brava' | 'cheefoodies';
const testTenants: Record<TestTenantType, ConversationHandlerModule> = {
  'carne-brava': carneBrava,
  cheefoodies,
};

// ===== SYSTEM KEYWORDS VERIFICATION =====
type SystemKeyword = keyof typeof SYSTEM_KEYWORDS;
const SYSTEM_KEYWORDS = {
  restart: ['reiniciar', 'reset', 'empezar'],
  help: ['ayuda', 'help', 'opciones'],
  admin: ['admin'],
} as const;

function isKeywordMessage(type: SystemKeyword, message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return SYSTEM_KEYWORDS[type].some((keyword) => lowerMessage.includes(keyword));
}

// ===== HANDLING TENANTS FOR SANDBOX =====
function detectTenantFromMessage(message: string): TestTenantType | null {
  const lowerMessage = message.toLowerCase().trim();
  if (lowerMessage.includes('brava')) return 'carne-brava';
  if (lowerMessage.includes('domicilios')) return 'cheefoodies';
  return null;
}

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

async function clearAllConversations(phoneNumber: string): Promise<void> {
  try {
    await Promise.all([carneBrava.clearConvo(phoneNumber), cheefoodies.clearConvo(phoneNumber)]);
    console.log(`🧹 Conversaciones limpiadas para ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Error limpiando conversaciones:', error);
  }
}

export const conversationHandler: ConversationHandler = async (phoneNumber, message) => {
  try {
    if (!phoneNumber || !message) {
      console.error('❌ phoneNumber o message vacío');
      return 'Error: Datos incompletos. Intenta nuevamente.';
    }

    const trimmedMessage = message.trim();
    console.log(`📱 Iniciando sandbox para ${phoneNumber}: "${trimmedMessage}"`);

    if (isKeywordMessage('restart', trimmedMessage)) {
      console.log('Reiniciando conversaciones...');
      await clearAllConversations(phoneNumber);
      return `✅ *Conversaciones reiniciadas*\n\n${getInitialWelcomeMessage()}`;
    }

    if (isKeywordMessage('help', trimmedMessage)) {
      console.log('Mostrando ayuda...');
      return getHelpMessage();
    }

    if (isKeywordMessage('admin', trimmedMessage)) {
      console.log('Validando comando admin');
      return handleAdminCommand(phoneNumber);
    }

    // Verificar si hay conversación activa
    const activeTenant = await getActiveTenant(phoneNumber);

    if (activeTenant) {
      console.log(`🔄 Continuando conversación activa con ${activeTenant}`);
      return await testTenants[activeTenant].conversationHandler(phoneNumber, trimmedMessage);
    }

    const detectedTenant = detectTenantFromMessage(trimmedMessage);
    if (detectedTenant) {
      console.log(`Iniciando nueva conversación con ${detectedTenant}`);
      return await testTenants[detectedTenant].conversationHandler(phoneNumber, trimmedMessage);
    }

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

// ===== Exportaciones para compatibilidad (aunque no se usen directamente) =====
export const hasActiveConvo = async (phone: string): Promise<boolean> => {
  const activeTenant = await getActiveTenant(phone);
  return activeTenant !== null;
};
export const clearConvo = async (phone: string) => await clearAllConversations(phone);
