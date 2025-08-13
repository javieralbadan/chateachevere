import { OrderData } from '@/types/conversation';
import { db } from '@/utils/server/firebase';
import { getUnavailableResponse, isFirebaseStaticExport } from '@/utils/server/firebase-check';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') ?? '';
    const tenantId = searchParams.get('tenantId') ?? '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') ?? '';

    if (!token || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Token y tenantId son requeridos' },
        { status: 400 },
      );
    }

    // Validar sesión
    const sessionDoc = await db.collection('adminSessions').doc(token).get();
    const sessionData = sessionDoc.data() as { isActive?: boolean; tenantId?: string } | undefined;

    if (!sessionDoc.exists || !sessionData?.isActive || sessionData.tenantId !== tenantId) {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }

    // Construir query base
    let query = db
      .collection('orders')
      .where('tenant', '==', tenantId)
      .orderBy('createdAt', 'desc');

    // Filtrar por status si se proporciona
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Obtener total de documentos para paginación
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Aplicar paginación
    const offset = (page - 1) * limit;
    const ordersSnapshot = await query.offset(offset).limit(limit).get();

    const orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data() as OrderData;
      let createdAt: string | undefined;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAt = data.createdAt;
      }

      return {
        id: doc.id,
        ...data,
        createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

interface PatchBody {
  token: string;
  tenantId: string;
  orderId: string;
  status: string;
}

// Actualizar status de una orden
export async function PATCH(request: NextRequest) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  try {
    const body = (await request.json()) as unknown;
    const { token, tenantId, orderId, status } = body as PatchBody;

    if (!token || !tenantId || !orderId || !status) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // Validar sesión
    const sessionDoc = await db.collection('adminSessions').doc(token).get();
    const sessionData = sessionDoc.data() as { isActive?: boolean; tenantId?: string } | undefined;

    if (!sessionDoc.exists || !sessionData?.isActive || sessionData.tenantId !== tenantId) {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }

    // Actualizar la orden
    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
