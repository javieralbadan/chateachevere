import type { CreateOrderProps, OrderData } from '@/types/conversation';
import { formatPrice } from '@/utils/formatters';
import { db, Timestamp } from '@/utils/server/firebase';
import { isTestingOrder } from '@/utils/tenantUtils';
import { calculateCartTotal, calculateDeliveryTotal } from './cart';

const logModule = process.env.LOG_CORE_ORDER === 'true';

export const createOrder = ({ tenantInfo, phoneNumber, cart }: CreateOrderProps): OrderData => {
  if (logModule) console.log('📝 Creando orden:', tenantInfo, phoneNumber, cart);

  try {
    const subtotal = calculateCartTotal(cart);
    const deliveryTotal = calculateDeliveryTotal(cart, tenantInfo.deliveryCost);
    const total = subtotal + deliveryTotal;
    const orderNumber = Date.now().toString().slice(-6);

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
      isTest: isTestingOrder(tenantInfo.name),
      createdAt: Timestamp.now(),
    };
    if (logModule) console.log('🚀 Objeto orderData:', orderData);

    return orderData;
  } catch (error) {
    console.error('❌ Error creando orden:', error);
    throw error;
  }
};

export const storeOrderInDB = async (orderData: OrderData): Promise<string> => {
  if (logModule) console.log('📝 Guardando pedido en Firestore:', orderData);

  try {
    const docRef = await db.collection('orders').add(orderData);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error guardando orden en DB:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<OrderData | null> => {
  if (logModule) console.log('📝 Obteniendo pedido de Firestore:', orderId);

  try {
    const docRef = db.collection('orders').doc(orderId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as OrderData;
    } else {
      if (logModule) console.log('❌ Pedido no encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
    return null;
  }
};

// Obtener mensaje para flujo de reenviar pedido a whatsapp de pagos
export const generateOrderSummary = (order: OrderData): string => {
  const { orderNumber, cart, subtotal, deliveryTotal, total } = order;

  let summary = `*NUEVO PEDIDO #${orderNumber}*\n`;
  summary += `${new Date().toLocaleString('es-CO')}\n\n`;

  summary += '*DETALLE DEL PEDIDO:*\n';
  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    summary += `- ${item.name}\n`;
    summary += `${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n\n`;
  });

  summary += '*RESUMEN DE PAGO:*\n';
  summary += `Subtotal: ${formatPrice(subtotal)}\n`;
  summary += `Domicilio: ${formatPrice(deliveryTotal)}\n`;
  summary += `*TOTAL: ${formatPrice(total)}*\n\n`;

  summary += 'Por favor envia este mensaje (sin modificar)\n';
  summary += 'Seguidamente, envía tu nombre, teléfono, dirección y adjunta imagen de transferencia';

  return summary;
};
