import {
  CategoriesConfig,
  CategoriesFlowConfig,
  SequentialConfig,
  SequentialFlowConfig,
  TenantConfig,
} from '@/types/menu';
import {
  SpanisCustomizableMenuItem,
  SpanishCategoriesFlowConfig,
  SpanishSequentialFlowConfig,
  SpanishTenantConfig,
} from '@/types/menu-spanish';

const logModule = process.env.LOG_TENANT_MAPPER === 'true';

// Función para transformar configuración español a inglés
export function mapConfigSpanishToEnglish(spanishConfig: SpanishTenantConfig): TenantConfig {
  if (isSpanishSequentialFlow(spanishConfig)) {
    if (logModule) console.log('Is Spanish Sequential Flow:');
    return mapSequentialFlow(spanishConfig as SpanishSequentialFlowConfig);
  } else {
    if (logModule) console.log('Is Spanish Categories Flow:');
    return mapCategoriesFlow(spanishConfig as SpanishCategoriesFlowConfig);
  }
}

// Type guard para config del flujo secuencial en español
function isSpanishSequentialFlow(config: SpanishTenantConfig) {
  if (!(config as SpanishSequentialFlowConfig).etapas) {
    return false;
  }

  const hasSteps = Object.keys((config as SpanishSequentialFlowConfig).etapas)?.length > 0;
  return typeof (config as SpanishSequentialFlowConfig).etapas === 'object' && hasSteps;
}

function mapSequentialFlow(spanishConfig: SpanishSequentialFlowConfig) {
  const transformedSteps: SequentialConfig = spanishConfig.etapas.map((step) => ({
    order: step.orden,
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
    flowType: 'sequential',
    transfersPhoneNumber: spanishConfig.numeroTransferencias,
    deliveryCost: spanishConfig.costoDomicilio,
    initialMessage: spanishConfig.mensajeInicial,
    footerInfo: spanishConfig.infoAdicional || '',
    steps: transformedSteps,
  } as SequentialFlowConfig;
}

function mapCategoriesFlow(spanishConfig: SpanishCategoriesFlowConfig) {
  const transformedCategories: CategoriesConfig = {};

  Object.entries(spanishConfig.categorias).forEach(([key, category]) => {
    transformedCategories[key] = {
      name: category.nombre,
      emoji: category.emoji,
      footerInfo: category.infoAdicional || '',
      // Transformar items de cada categoría
      items: category.items.map((item) => {
        const baseObject = {
          name: item.nombre,
          price: item.precio,
          description: item.descripcion || '',
        };
        const customizedItem = item as SpanisCustomizableMenuItem;
        if (customizedItem.personalizacion) {
          return {
            ...baseObject,
            customizationSteps: customizedItem.personalizacion,
          };
        }

        return baseObject;
      }),
    };
  });

  return {
    flowType: 'categories',
    transfersPhoneNumber: spanishConfig.numeroTransferencias,
    deliveryCost: spanishConfig.costoDomicilio,
    categories: transformedCategories,
  } as CategoriesFlowConfig;
}
