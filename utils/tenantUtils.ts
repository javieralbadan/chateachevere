import { SpanishConfiguration, TenantConfig } from '@/types/conversation';
import { mapConfigSpanishToEnglish } from '@/utils/mappers/tenantConfig';
import { DateTime } from 'luxon';

const isDev = process.env.NODE_ENV === 'development';

export function isTestingOrder(tenantName: string): boolean {
  const tenantsTesters = ['cheefoodies'];
  // TODO: Cambiar por attributo en Firestore
  return isDev || tenantsTesters.includes(tenantName);
}

export function isWeekend(): boolean {
  const now = DateTime.now().setZone('America/Bogota');
  const dayOfWeek = now.weekday;
  // Luxon: Lunes (1). Sábado (6) y Domingo (7) son fin de semana
  return dayOfWeek === 6 || dayOfWeek === 7;
}

function validateConfiguation(config: SpanishConfiguration): config is SpanishConfiguration {
  return (
    config &&
    typeof config === 'object' &&
    typeof config.numeroTransferencias === 'string' &&
    typeof config.costoDomicilio === 'number' &&
    config.categorias &&
    typeof config.categorias === 'object'
  );
}

async function fetchConfigFromGist(url: string): Promise<SpanishConfiguration | null> {
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) {
      console.warn(`Error al fetchear configuración: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as SpanishConfiguration;

    if (!validateConfiguation(data)) {
      console.warn('Configuración desde Gist no tiene la estructura esperada');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error al fetchear o parsear configuración desde Gist:', error);
    return null;
  }
}

export async function getTenantConfig(
  fallbackData: SpanishConfiguration,
  fetchUrl?: string,
): Promise<TenantConfig> {
  if (!fetchUrl) {
    return mapConfigSpanishToEnglish(fallbackData);
  }

  let configFromGist;
  try {
    // Intentar fetch de configuraciones desde Gist
    configFromGist = await fetchConfigFromGist(fetchUrl);

    // Usar configuración de Gist si está disponible y es válida
    if (!configFromGist) {
      console.error('⚠️ Usando configuraciones fallback');
      return mapConfigSpanishToEnglish(fallbackData);
    }

    const mappedConfig = mapConfigSpanishToEnglish(configFromGist);
    console.log('✅ Configuración cargada desde Gist', mappedConfig);
    return mappedConfig;
  } catch (error) {
    console.error('⚠️ Usando configuraciones fallback', error);
    return mapConfigSpanishToEnglish(fallbackData);
  }
}
