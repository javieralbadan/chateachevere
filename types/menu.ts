export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface Category {
  name: string;
  emoji: string;
  footerInfo?: string;
  items: MenuItem[];
}

export interface SequentialFlowStep extends Category {
  order: number;
}

export interface TenantConfigBase {
  transfersPhoneNumber: string;
  deliveryCost: number;
}

export interface SequentialFlowConfig extends TenantConfigBase {
  initialMessage: string;
  steps: SequentialFlowStep[];
}

export interface CategoriesFlowConfig extends TenantConfigBase {
  categories: Record<string, Category>;
}

export type TenantConfig = SequentialFlowConfig | CategoriesFlowConfig;
