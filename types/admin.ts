import { Timestamp } from '@/utils/server/firebase';
import { OrderData } from './conversation';

export interface Order extends OrderData {
  id: string;
}

export interface AdminSession {
  phoneNumber: string;
  isActive: boolean;
  tenantId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastActivity?: Timestamp;
}

export interface OrdersResponse {
  success: boolean;
  data?: {
    orders: Order[];
    pagination: {
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface OrdersState {
  orders: Order[];
  pagination: Pagination | null;
  loading: boolean;
  currentPage: number;
  statusFilter: string;
  searchTerm: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
