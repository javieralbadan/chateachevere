import { TenantSetup } from '@/types/whatsapp';
import { db } from '@/utils/server/firebase';

// Cache en memoria para reducir llamadas a Firestore
const logModule = process.env.LOG_CORE_TENANT === 'true';

const configCache = new Map<string, { config: TenantSetup | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getTenantSetupFromDB(
  attribute: string,
  phoneNumberId: string,
): Promise<TenantSetup | null> {
  // Verificar cache primero
  const cached = configCache.get(phoneNumberId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  try {
    const tenantsRef = db.collection('tenants');
    const querySnapshot = await tenantsRef.where(attribute, '==', phoneNumberId).limit(1).get();

    if (querySnapshot.empty) {
      console.error(`❌ Tenant not found in Firestore for phone_number_id: ${phoneNumberId}`);
      configCache.set(phoneNumberId, { config: null, timestamp: Date.now() });
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    const config: TenantSetup = {
      name: data.name as string,
      phoneNumberId: data.phoneNumberId as string,
      accessToken: data.accessToken as string,
      handlerKey: doc.id,
    };
    if (logModule) console.log('🔥 TenantSetup from DB, config:', config);

    // Validar configuración
    if (!config.phoneNumberId || !config.accessToken) {
      console.error(`❌ Incomplete config in Firestore for phone_number_id: ${phoneNumberId}`);
      configCache.set(phoneNumberId, { config: null, timestamp: Date.now() });
      return null;
    }

    // Guardar en cache
    configCache.set(phoneNumberId, { config, timestamp: Date.now() });
    return config;
  } catch (error) {
    console.error(`❌ Error fetching tenant config from Firestore: ${phoneNumberId}`, error);
    configCache.set(phoneNumberId, { config: null, timestamp: Date.now() });
    return null;
  }
}
