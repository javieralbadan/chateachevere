import { CategoriesFlowConfig, Category, SequentialFlowConfig, TenantConfig } from '@/types/menu';
import { SpanishCategoriesFlowConfig, SpanishSequentialFlowConfig, SpanishTenantConfig } from '@/types/menu-spanish';

const logModule = process.env.LOG_TENANT_MAPPER || false;

// Función para transformar configuración española a inglés
export function mapConfigSpanishToEnglish(spanishConfig: SpanishTenantConfig): TenantConfig {
  if (isSpanishSequentialFlow(spanishConfig)) {
    if (logModule) console.log('Is Spanish Sequential Flow:');
    return mapSequentialFlow(spanishConfig as SpanishSequentialFlowConfig);
  } else {
    if (logModule) console.log('Is Spanish Categories Flow:');
    return mapCategoriesFlow(spanishConfig as SpanishCategoriesFlowConfig);
  }
}

// Type guard para config del flujo secuencial en español, implementación similar a isSequentialFlow
function isSpanishSequentialFlow (config: SpanishTenantConfig) {
  if (!(config as SpanishSequentialFlowConfig).etapas) {
    return false;
  }

  const hasSteps = Object.keys((config as SpanishSequentialFlowConfig).etapas)?.length > 0;
  return typeof (config as SpanishSequentialFlowConfig).etapas === 'object' && hasSteps;
}

function mapSequentialFlow(spanishConfig: SpanishSequentialFlowConfig) {
  const transformedSteps = spanishConfig.etapas.map((step) => ({
    order: step.orden,
    priceSource: step.determinaElPrecio,
    name: step.nombre,
    emoji: step.emoji,
    footerInfo: step.infoAdicional || '',
    // Transformar items de cada paso
    items: step.items.map((item) => ({
      name: item.nombre,
      price: item.precio,
      description: item.descripcion || '',
    })),
  }));

  return {
    transfersPhoneNumber: spanishConfig.numeroTransferencias,
    deliveryCost: spanishConfig.costoDomicilio,
    initialMessage: spanishConfig.mensajeInicial,
    steps: transformedSteps,
  } as SequentialFlowConfig;
}

function mapCategoriesFlow(spanishConfig: SpanishCategoriesFlowConfig) {
  const transformedCategories: Record<string, Category> = {};

  Object.entries(spanishConfig.categorias).forEach(([key, category]) => {
    transformedCategories[key] = {
      name: category.nombre,
      emoji: category.emoji,
      footerInfo: category.infoAdicional || '',
      // Transformar items de cada categoría
      items: category.items.map((item) => ({
        name: item.nombre,
        price: item.precio,
        description: item.descripcion || '',
      })),
    };
  });

  return {
    transfersPhoneNumber: spanishConfig.numeroTransferencias,
    deliveryCost: spanishConfig.costoDomicilio,
    categories: transformedCategories,
  } as CategoriesFlowConfig;
}
