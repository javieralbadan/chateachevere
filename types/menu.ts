import { CartConversation, ConversationManager, OrderData } from './conversation';

// ===== BASIC CONFIG =====

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export type FlowType = 'sequential' | 'categories';

export interface TenantConfigBase {
  tenantId: string;
  flowType: FlowType;
  transfersPhoneNumber: string;
  deliveryCost: number;
}

export type TenantConfig = SequentialFlowConfig | CategoriesFlowConfig;

// ===== CATEGORY FLOW =====

export interface Category {
  name: string;
  emoji: string;
  footerInfo?: string;
  items: MenuItem[];
}

export type CategoriesConfig = Record<string, Category>;
export interface CategoriesFlowConfig extends TenantConfigBase {
  categories: CategoriesConfig;
}

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
type CustomMessages = {
  getWelcomeMessage: CustomMessageFn;
  getRepeatFlowMessage: CustomMessageFn;
};

export interface GetFinalMessageProps {
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
