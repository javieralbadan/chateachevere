import { CartConversation, ConversationManager, OrderData } from './conversation';

// ===== BASIC CONFIG =====

export type FlowType = 'sequential' | 'categories';

// TODO: Agregar atributo para shortPriceFormat
export interface TenantConfigBase {
  tenantId: string;
  flowType: FlowType;
  transfersPhoneNumber: string;
  deliveryCost: number;
}

export type TenantConfig = SequentialFlowConfig | CategoriesFlowConfig;

// ===== CATEGORY FLOW =====

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

interface BaseCategory {
  name: string;
  emoji: string;
  footerInfo?: string;
}

export interface Category extends BaseCategory {
  items: MenuItem[];
}

export interface CustomizableCategory extends BaseCategory {
  options: MenuItem[];
  order: number;
}

export interface CustomizableMenuItem extends MenuItem {
  customizationSteps: CustomizableCategory[];
}

export type CategoriesConfig = Record<string, Category>;
export interface CategoriesFlowConfig extends TenantConfigBase {
  categories: CategoriesConfig;
}

export type CompleteCustomizationProps = {
  phoneNumber: string;
  selections: Record<string, MenuItem>;
  baseItem: MenuItem;
};

export type CompleteCustomizationFn = (props: CompleteCustomizationProps) => Promise<string>;

// ===== SEQUENTIAL FLOW =====

export interface SequentialFlowStep extends Category {
  order: number;
}

export type SequentialConfig = SequentialFlowStep[];
export interface SequentialFlowConfig extends TenantConfigBase {
  initialMessage: string;
  footerInfo?: string;
  steps: SequentialConfig;
}

interface SequentialSelection {
  stepName: string;
  selectedItem: {
    name: string;
    price: number;
  };
}

export type SequentialSelections = Record<string, SequentialSelection>;

// ===== HANDLERS =====

export interface CategoriesHandlersProps {
  tenantConfig: CategoriesFlowConfig;
  manager: ConversationManager;
  customMessages: CustomMessages;
}

export interface SequentialHandlersProps {
  tenantConfig: SequentialFlowConfig;
  manager: ConversationManager;
  customMessages: CustomMessages;
}

export interface CartHandlersProps {
  tenantConfig: TenantConfig;
  manager: ConversationManager;
  conditionalMessages: ConditionalMessages;
}

export type StepProps = {
  phoneNumber: string;
  message: string;
  conversation: CartConversation;
};

export type StepHandler = (Props: StepProps) => Promise<string>;

// ===== CUSTOM MESSAGES =====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomMessageFn = (...args: any[]) => string | Promise<string>;
export type CustomMessages = {
  getWelcomeMessage: CustomMessageFn;
  getRepeatFlowMessage: CustomMessageFn;
  getItemsSelectionMessage?: (...args: any) => string;
  getCustomizableCategoryMessage?: (
    step: CustomizableCategory,
    baseItem: CustomizableMenuItem,
  ) => string;
  getQuantityMessage?: (menuItem: MenuItem) => string;
};

export interface GetFinalMessageProps {
  transfersPhoneNumber: string;
  orderId: string;
  orderData: OrderData;
}

export type GetWelcomeMessageFn = (msgPreliminar?: string, greeting?: boolean) => string;

type ConditionalMessagesByFlow = {
  getWelcomeMessage: CustomMessageFn;
  getRepeatFlowMessage: CustomMessageFn;
  getFinalMessage: CustomMessageFn;
};

export type ConditionalMessages = { [K in FlowType]?: ConditionalMessagesByFlow } & (
  | { sequential: ConditionalMessagesByFlow }
  | { categories: ConditionalMessagesByFlow }
);
