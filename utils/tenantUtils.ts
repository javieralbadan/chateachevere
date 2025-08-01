import { TenantConfig } from '@/types/menu';
import {
  SpanishCategoriesFlowConfig,
  SpanishSequentialFlowConfig,
  SpanishTenantConfig,
} from '@/types/menu-spanish';
import { mapConfigSpanishToEnglish } from '@/utils/mappers/tenantConfig';
import { DateTime } from 'luxon';

const isDev = process.env.NODE_ENV === 'development';
const logModule = process.env.LOG_TENANT_UTILS === 'true';

export function isTestingOrder(tenantName: string): boolean {
  const tenantsTesters = ['cheefoodies'];
  // TODO: Obtener desde Firestore attributo del tenant isTest
  return isDev || tenantsTesters.includes(tenantName);
}

export function isWeekend(): boolean {
  const now = DateTime.now().setZone('America/Bogota');
  const dayOfWeek = now.weekday;
  // Luxon: Lunes (1). Sábado (6) y Domingo (7) son fin de semana
  return dayOfWeek === 6 || dayOfWeek === 7;
}

function validateConfiguration(config: SpanishTenantConfig): config is SpanishTenantConfig {
  const isValidSequentialFlow =
    (config as SpanishSequentialFlowConfig).etapas &&
    typeof (config as SpanishSequentialFlowConfig).etapas === 'object';
  const isValidCategories =
    (config as SpanishCategoriesFlowConfig).categorias &&
    typeof (config as SpanishCategoriesFlowConfig).categorias === 'object';

  return (
    config &&
    typeof config === 'object' &&
    typeof config.numeroTransferencias === 'string' &&
    typeof config.costoDomicilio === 'number' &&
    (isValidCategories || isValidSequentialFlow)
  );
}

async function fetchConfigFromGist(url: string): Promise<SpanishTenantConfig | null> {
  try {
    if (logModule) console.log('> Fetching config from Gist url:', url);

    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      console.warn(`Error al fetchear configuración: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as SpanishTenantConfig;

    if (!validateConfiguration(data)) {
      console.warn('Configuración desde Gist no tiene la estructura esperada');
      return null;
    }

    if (logModule) console.log('⏬ Fetched config from Gist ~ data:', data);
    return data;
  } catch (error) {
    console.error('Error al fetchear o parsear configuración desde Gist:', error);
    return null;
  }
}

export async function getTenantConfig(
  fallbackData: SpanishTenantConfig,
  fetchUrl?: string,
): Promise<Omit<TenantConfig, 'tenantId'>> {
  if (!fetchUrl) {
    if (logModule) console.log('⚠️ Usando configuraciones fallback. No hay fetchUrl');
    return mapConfigSpanishToEnglish(fallbackData);
  }

  let configFromGist;
  try {
    // Intentar fetch de configuraciones desde Gist
    configFromGist = await fetchConfigFromGist(fetchUrl);

    // Usar configuración de Gist si está disponible y es válida
    if (!configFromGist) {
      if (logModule)
        console.error('⚠️ Usando configuraciones fallback. No hay data al hacer fetch');
      return mapConfigSpanishToEnglish(fallbackData);
    }

    const mappedConfig = mapConfigSpanishToEnglish(configFromGist);
    if (logModule) console.log('✅ Configuración cargada desde Gist', mappedConfig);

    return mappedConfig;
  } catch (error) {
    console.error('⚠️ Usando configuraciones fallback', error);
    return mapConfigSpanishToEnglish(fallbackData);
  }
}
