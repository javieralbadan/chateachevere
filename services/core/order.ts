import { addDoc, collection, db, doc, getDoc } from '@/utils/firebase';
import { formatPrice } from '../utils';
import { calculateCartTotal, calculateDeliveryTotal, CartItem } from './cart';

const isDev = process.env.NODE_ENV === 'development';

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
  createdAt: number;
  status?: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  customerName?: string;
}

// Crear objeto order
export const createOrder = ({ tenantInfo, phoneNumber, cart }: CreateOrderProps): OrderData => {
  try {
    const subtotal = calculateCartTotal(cart);
    const deliveryTotal = calculateDeliveryTotal(cart, tenantInfo.deliveryCost);
    const total = subtotal + deliveryTotal;
    // TODO: Definir si se crea ese order id o el de firestore
    const orderNumber = Date.now().toString().slice(-6);
    const now = Date.now();

    const orderData: OrderData = {
      tenant: tenantInfo.name,
      transfersPhoneNumber: tenantInfo.transfersPhoneNumber,
      customerPhoneNumber: phoneNumber,
      orderNumber,
      cart,
      total,
      subtotal,
      deliveryTotal,
      status: 'pending',
      isTest: isDev,
      createdAt: now,
    };

    return orderData;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

// Guardar pedido en Firestore
export const storeOrderInDB = async (orderData: OrderData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    console.log('📝 Order created with ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<OrderData | null> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as OrderData;
    } else {
      console.log('❌ Pedido no encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
    return null;
  }
};

// Obtener mensaje para flujo de reenviar pedido a whatsapp de pagos
export const generateOrderSummary = (order: OrderData): string => {
  console.log('📋 generateOrderSummary');
  const { orderNumber, cart, subtotal, deliveryTotal, total } = order;

  let summary = `🍽️ *NUEVO PEDIDO #${orderNumber}*\n`;
  summary += `${new Date().toLocaleString('es-CO')}\n\n`;

  summary += '📋 *DETALLE DEL PEDIDO:*\n';
  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    summary += `👉🏼 ${item.name}\n`;
    summary += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  summary += '💰 *RESUMEN DE PAGO:*\n';
  summary += `Subtotal: ${formatPrice(subtotal)}\n`;
  summary += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  summary += `*TOTAL: ${formatPrice(total)}*\n\n`;

  summary += 'Por favor envia este mensaje (sin modificar)\n';
  summary += 'Seguidamente, envía tu nombre, teléfono, dirección y adjunta imagen de transferencia';

  return summary;
};
