export interface SpanishMenuItem {
  nombre: string;
  precio: number;
  descripcion?: string;
}

interface SpanishBaseCategory {
  nombre: string;
  emoji: string;
  infoAdicional?: string;
}

export interface SpanishCategory extends SpanishBaseCategory {
  items: SpanishMenuItem[];
}

export interface SpanishCustomizableCategory extends SpanishBaseCategory {
  opciones: SpanishMenuItem[];
  orden: number;
}

export interface SpanisCustomizableMenuItem extends SpanishMenuItem {
  personalizacion: SpanishCustomizableCategory[];
}

export interface SpanishSequentialFlowStep extends SpanishCategory {
  orden: number;
}

export interface SpanishConfigurationBase {
  numeroTransferencias: string;
  costoDomicilio: number;
}

export interface SpanishSequentialFlowConfig extends SpanishConfigurationBase {
  mensajeInicial: string;
  infoAdicional?: string;
  etapas: SpanishSequentialFlowStep[];
}

export interface SpanishCategoriesFlowConfig extends SpanishConfigurationBase {
  categorias: Record<string, SpanishCategory>;
}

export type SpanishTenantConfig = SpanishSequentialFlowConfig | SpanishCategoriesFlowConfig;
