import { TenantSetup } from '@/types/whatsapp';
import { generateSecureToken } from '@/utils/server/crypto';
import { db, Timestamp } from '@/utils/server/firebase';

const ADMIN_BASE_URL = 'https://chatea-chevere.vercel.app';
const HOURS_24 = 24 * 60 * 60 * 1000;
const ACCESS_MSG = `🔐 *Acceso Autorizado*
Haz clic en el enlace para acceder al panel de administración:\n\n`;

export const handleAdminCommand = async (phoneNumber: string): Promise<string> => {
  const allowedTenants = await checkAdminPermissions(phoneNumber);

  if (allowedTenants.length === 0) {
    return '❌ No tienes permisos de administrador. Contáctanos directamente si crees que esto es un error.';
  }

  let message = ACCESS_MSG;

  if (allowedTenants.length === 1) {
    // Solo un tenant, generar link directo
    const tenantId = allowedTenants[0];
    const sessionToken = await createAdminSession(phoneNumber, tenantId);
    message += `${ADMIN_BASE_URL}/admin/${tenantId}?token=${sessionToken}\n`;
    return message;
  }

  // Múltiples tenants, mostrar opciones
  for (const tenantId of allowedTenants) {
    const sessionToken = await createAdminSession(phoneNumber, tenantId);
    message += `• *${tenantId.toUpperCase()}*: ${ADMIN_BASE_URL}/admin/${tenantId}?token=${sessionToken}\n`;
  }

  message += '\n⚠️ Por seguridad, todo enlace expira en 24 horas';
  return message;
};

const checkAdminPermissions = async (phoneNumber: string): Promise<string[]> => {
  try {
    const tenantsSnapshot = await db.collection('tenants').get();
    const allowedTenants: string[] = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantData = tenantDoc.data() as TenantSetup;
      const adminPhones = tenantData.adminPhones || [];

      if (adminPhones.includes(phoneNumber)) {
        allowedTenants.push(tenantDoc.id);
      }
    }

    return allowedTenants;
  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    return [];
  }
};

const createAdminSession = async (phoneNumber: string, tenantId: string): Promise<string> => {
  try {
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + HOURS_24);

    await db
      .collection('adminSessions')
      .doc(sessionToken)
      .set({
        phoneNumber,
        tenantId,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        isActive: true,
      });

    return sessionToken;
  } catch (error) {
    console.error('Error creando sesión de admin:', error);
    throw error;
  }
};
