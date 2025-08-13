import { TenantSetup } from '@/types/whatsapp';
import { db } from '@/utils/server/firebase';

const logModule = process.env.LOG_CORE_TENANT === 'true';

// Cache en memoria para reducir llamadas a Firestore
const configCache = new Map<string, { config: TenantSetup | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getTenantSetupFromDB(
  attribute: string,
  fieldValue: string,
): Promise<TenantSetup | null> {
  // Verificar cache primero
  const cached = configCache.get(fieldValue);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  try {
    const tenantsRef = db.collection('tenants');
    const querySnapshot = await tenantsRef.where(attribute, '==', fieldValue).limit(1).get();

    if (querySnapshot.empty) {
      console.error('❌ Tenant not found in Firestore');
      resetCache(attribute, fieldValue);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as TenantSetup;

    const config: TenantSetup = {
      ...data,
      handlerKey: doc.id,
    };
    if (logModule) console.log('🔥 TenantSetup from DB, config:', config);

    // Validar configuración
    if (!config.phoneNumberId || !config.accessToken) {
      console.error('❌ Incomplete config in Firestore');
      resetCache(attribute, fieldValue);
      return null;
    }

    configCache.set(config.phoneNumberId, { config, timestamp: Date.now() });
    return config;
  } catch (error) {
    console.error('❌ Error fetching tenant config from Firestore', error);
    resetCache(attribute, fieldValue);
    return null;
  }
}

const resetCache = (attribute: string, fieldValue: string): void => {
  if (attribute === 'phoneNumberId') {
    console.log(`Reset cache for phoneNumberId: ${attribute}-${fieldValue}`);
    configCache.set(fieldValue, { config: null, timestamp: Date.now() });
  }
};
