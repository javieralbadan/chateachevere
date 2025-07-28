export interface SpanishMenuItem {
  nombre: string;
  precio: number;
  descripcion?: string;
}

export interface SpanishCategory {
  nombre: string;
  emoji: string;
  infoAdicional?: string;
  items: SpanishMenuItem[];
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
