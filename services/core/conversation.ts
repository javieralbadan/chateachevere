import { Category } from '../tenants/cheefoodies/config';
import { CartItem } from './cart';

type ConversationStep =
  | 'welcome' // Step para escoger categoría
  | 'category_selection' // Step genérico - escoger items de categoría
  | 'item_selection' // Step genérico - escoger items de categoría
  | 'quantity_selection'
  | 'cart_actions'
  | 'checkout'
  | 'final';

export interface BaseConversationState {
  step: ConversationStep;
  cart: CartItem[];
  lastInteraction: number;
}

// TODO: Make this more reusable -> Category & Selection
export interface UserConversation extends BaseConversationState {
  phoneNumber: string;
  selectedCategory?: Category;
  selectedItem?: string;
  selectedItemIndex?: number;
}
