import { Timestamp } from '@/utils/server/firebase';

// ***************
// CONVERSATION
// ***************

export interface CacheEntry<T> {
  data: T;
  expires: number;
}

type ConversationStep =
  | 'welcome' // Step para escoger categoría
  | 'category_selection' // Step genérico - escoger items de categoría -> first_level_selection
  | 'item_selection' // Step genérico - escoger items de categoría -> second_level_selection
  | 'quantity_selection'
  | 'cart_actions'
  | 'checkout'
  | 'final';

export interface ConversationConfig {
  tenantId: string;
  timeoutMinutes: number;
}

export interface BaseConversation {
  key: string;
  step: ConversationStep;
  lastInteraction: number;
}

export type StepProps<T extends BaseConversation> = {
  phoneNumber: string;
  message: string;
  conversation: T;
};

export type StepHandler<T extends BaseConversation> = (Props: StepProps<T>) => Promise<string>;

export interface Conversation<T extends BaseConversation> {
  config: ConversationConfig;
  stepHandlers: Record<string, StepHandler<T>>;
}

export type InitialConvo<T> = Omit<T, 'key' | 'lastInteraction'>;

// ***************
// MENU
// ***************

interface SpanishItem {
  nombre: string;
  precio: number;
}

interface SpanishCategory {
  nombre: string;
  emoji: string;
  infoAdicional?: string;
  items: SpanishItem[];
}

export interface SpanishConfiguration {
  numeroTransferencias: string;
  costoDomicilio: number;
  categorias: Record<string, SpanishCategory>;
}

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface MenuCategory {
  name: string;
  emoji: string;
  items: MenuItem[];
  footerInfo?: string;
}

interface CategorySelectionProps {
  message: string;
  categories: Record<string, MenuCategory>;
  welcomeMessageFn: GetWelcomeMessageFn;
  updateConversationFn: (selectedCategoryKey: string) => Promise<void>;
}

export type CategorySelectionPropsFn = (Props: CategorySelectionProps) => Promise<string>;

interface ItemSelectionProps {
  message: string;
  category: MenuCategory;
  welcomeMessageFn: GetWelcomeMessageFn;
  updateConversationFn: (option: number, selectedItem: MenuItem) => Promise<void>;
}

export type ItemSelectionPropsFn = (Props: ItemSelectionProps) => Promise<string>;

// ***************
// CART
// ***************

export interface CartItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
  itemIndex: number;
}

// Extender BaseConversation para incluir los campos específicos del carrito
export interface CartConversation extends BaseConversation {
  cart: CartItem[];
  selectedCategory?: string;
  selectedItem?: string;
  selectedItemIndex?: number;
}

interface QuantitySelectionProps {
  conversation: CartConversation;
  quantity: number;
  price: number;
  deliveryCost: number;
  updateConversationFn: (updatedCart: CartItem[]) => Promise<void>;
}

export type QuantitySelectionFn = (Props: QuantitySelectionProps) => Promise<string>;

interface CartActionsProps {
  conversation: CartConversation;
  option: number;
  deliveryCost: number;
  transfersPhoneNumber: string;
  updateConversationFn: (updates: Partial<CartConversation>) => Promise<void>;
  welcomeMessageFn: GetWelcomeMessageFn;
  addMoreItemsFn: () => string;
}

export type CartActionsFn = (Props: CartActionsProps) => Promise<string>;

interface CheckoutMessageProps {
  cart: CartItem[];
  deliveryCost: number;
  transfersPhoneNumber: string;
}

export type CheckoutMessageFn = (Props: CheckoutMessageProps) => string;

interface CheckoutProps {
  conversation: CartConversation;
  option: number;
  deliveryCost: number;
  transfersPhoneNumber: string;
  updateConversationFn: (updates: Partial<CartConversation>) => Promise<void>;
  welcomeMessageFn: GetWelcomeMessageFn;
  addMoreItemsFn: () => string;
  finalMessageFn: () => Promise<string>;
}

export type CheckoutFn = (Props: CheckoutProps) => Promise<string>;

// ***************
// ORDER
// ***************

export interface TenantInfo {
  name: string;
  transfersPhoneNumber: string;
  deliveryCost: number;
}

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

// ***************
// HANDLERS
// ***************

export interface TenantConfig {
  transfersPhoneNumber: string;
  deliveryCost: number;
  categories: Record<string, MenuCategory>;
}

export type TenantHandler = StepHandler<CartConversation>;

export type GetWelcomeMessageFn = (msgPreliminar?: string, greeting?: boolean) => string;
