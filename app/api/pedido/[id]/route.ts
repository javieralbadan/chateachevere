import { generateOrderSummary, getOrderById } from '@/services/core/order';
import { handleNextErrorResponse } from '@/utils/mappers/nextResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id?: string }> }) {
  const { id: orderId } = await params;
  if (!orderId) {
    return handleNextErrorResponse('ID del pedido vacío', 400);
  }

  try {
    const orderData = await getOrderById(orderId);

    if (!orderData) {
      return handleNextErrorResponse('Pedido no encontrado', 404);
    }

    const orderSummary = generateOrderSummary(orderData);
    const whatsappUrl = `https://wa.me/${orderData.transfersPhoneNumber}?text=${encodeURIComponent(orderSummary)}`;

    // Redirigir directamente a WhatsApp
    return NextResponse.redirect(whatsappUrl);
  } catch (error) {
    console.error('❌ Error in order API:', error);
    return handleNextErrorResponse(error as Error);
  }
}
