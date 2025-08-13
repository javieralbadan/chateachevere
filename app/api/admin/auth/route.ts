import { AdminSession } from '@/types/admin';
import { db, Timestamp } from '@/utils/server/firebase';
import { getUnavailableResponse, isFirebaseStaticExport } from '@/utils/server/firebase-check';
import { NextRequest, NextResponse } from 'next/server';

interface PostBody {
  token: string;
  tenantId: string;
}

export async function POST(request: NextRequest) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  try {
    const body = (await request.json()) as unknown;
    const { token, tenantId } = body as PostBody;

    if (!token || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Token y tenantId son requeridos' },
        { status: 400 },
      );
    }

    // Verificar el token en Firestore
    const sessionDoc = await db.collection('adminSessions').doc(token).get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const sessionData = sessionDoc.data() as AdminSession | undefined;
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Datos de sesión no encontrados' },
        { status: 500 },
      );
    }

    const now = Timestamp.now();

    // Verificar si la sesión está activa y no ha expirado
    if (!sessionData.isActive || sessionData.expiresAt.toMillis() < now.toMillis()) {
      // Marcar como inactiva si expiró
      await sessionDoc.ref.update({ isActive: false });

      return NextResponse.json({ success: false, error: 'Token expirado' }, { status: 401 });
    }

    // Verificar que el tenant coincida
    if (sessionData.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Token no válido para este tenant' },
        { status: 403 },
      );
    }

    await sessionDoc.ref.update({
      lastActivity: now,
    });

    return NextResponse.json({
      success: true,
      session: {
        phoneNumber: sessionData.phoneNumber,
        tenantId: sessionData.tenantId,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error validando sesión admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

interface DeleteBody {
  token: string;
}

// Endpoint para cerrar sesión
export async function DELETE(request: NextRequest) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  try {
    const body = (await request.json()) as unknown;
    const { token } = body as DeleteBody;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 });
    }

    await db.collection('adminSessions').doc(token).update({
      isActive: false,
      closedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
