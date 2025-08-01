import { Timestamp } from '@/utils/server/firebase';
import { FlowType, SequentialSelections, StepHandler } from './menu';

// ===== CONVERSATION =====

export interface CacheEntry {
  data: CartConversation;
  expires: number;
}

type ConversationStep =
  | 'category_welcome'
  | 'sequential_welcome'
  | 'sequential_step_selection'
  | 'category_selection'
  | 'item_selection'
  | 'quantity_selection'
  | 'cart_actions'
  | 'checkout'
  | 'final';

export type WelcomeConvoStep = ConversationStep & ('category_welcome' | 'sequential_welcome');
export type RepeatFlowConvoStep = ConversationStep & ('category_selection' | 'sequential_welcome');

export interface BaseConversation {
  key: string;
  step: ConversationStep;
  lastInteraction: number;
}

// Extender BaseConversation para incluir los campos específicos del carrito
export interface CartConversation extends BaseConversation {
  cart: CartItem[];
  // Para flujo de categories
  selectedCategory?: string;
  selectedItem?: {
    name: string;
    price: number;
    description?: string;
  };
  // Para flujo secuencial
  sequentialFlow?: {
    currentStep: number;
    selections: SequentialSelections;
    customizedItem?: { name: string; price: number };
  };
}

// ===== CONVERSATION MANAGER =====

export type InitialConvo = {
  step: FlowType;
  cart: [];
};

export interface ConvoBaseConfig {
  tenantId: string;
  flowType: FlowType;
  timeoutMinutes: number;
}

export interface ConvoConfig extends ConvoBaseConfig {
  stepHandlers: Record<string, StepHandler>;
}

export type GetOrCreateConversationFn = (
  phoneNumber: string,
  initialStep: WelcomeConvoStep,
) => Promise<CartConversation>;
export type UpdateConversationFn = (
  phoneNumber: string,
  updates: Partial<CartConversation>,
) => Promise<void>;
export type ClearConversationFn = (phoneNumber: string) => Promise<void>;
export type HasActiveConversationFn = (phoneNumber: string) => Promise<boolean>;
export type ProcessMessageFn = (
  phoneNumber: string,
  message: string,
  getWelcomeMessage: () => string,
) => Promise<string>;
export type RegisterHandlerFn = (step: string, handler: StepHandler) => void;

export interface ConversationManager {
  getOrCreateConversation: GetOrCreateConversationFn;
  updateConversation: UpdateConversationFn;
  clearConversation: ClearConversationFn;
  hasActiveConversation: HasActiveConversationFn;
  processMessage: ProcessMessageFn;
  registerHandler: RegisterHandlerFn;
}

// ===== CART =====

export interface CartItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface ValidateItemReturn {
  isValid: boolean;
  name?: string;
  price?: number;
  category?: string;
  error?: string;
}

interface CheckoutMessageProps {
  cart: CartItem[];
  deliveryCost: number;
  transfersPhoneNumber: string;
}

export type CheckoutMessageFn = (Props: CheckoutMessageProps) => string;

export interface TenantInfo {
  name: string;
  transfersPhoneNumber: string;
  deliveryCost: number;
}

// ===== ORDER =====

export interface CreateOrderProps {
  tenantInfo: TenantInfo;
  phoneNumber: string;
  cart: CartItem[];
}

export interface OrderData {
  id?: string;
  customerPhoneNumber: string;
  tenant: string;
  transfersPhoneNumber: string;
  orderNumber: string;
  cart: CartItem[];
  subtotal: number;
  deliveryTotal: number;
  total: number;
  isTest: boolean;
  createdAt: Timestamp;
  status?: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  customerName?: string;
}
