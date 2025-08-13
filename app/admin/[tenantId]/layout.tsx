'use client';
import ClientErrorBoundary from '@/components/molecules/ClientErrorBoundary';
import { AdminSession } from '@/types/admin';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContext, PropsWithChildren, use, useContext, useEffect, useState } from 'react';

const isDev = process.env.NODE_ENV === 'development';

interface AdminLayoutProps extends PropsWithChildren {
  params: Promise<{ tenantId: string }>;
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const resolvedParams = use(params);

  return (
    <ClientErrorBoundary>
      <AdminProvider tenantId={resolvedParams.tenantId}>
        <div className="min-h-screen bg-gray-50">{children}</div>
      </AdminProvider>
    </ClientErrorBoundary>
  );
}

interface AdminProviderProps extends PropsWithChildren {
  tenantId: string;
}

const AdminProvider = ({ children, tenantId }: AdminProviderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        void router.push('/');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, tenantId }),
        });

        const data: {
          success: boolean;
          error?: string;
          session?: AdminSession;
        } = (await response.json()) as {
          success: boolean;
          error?: string;
          session?: AdminSession;
        };

        if (!data.success) {
          setError(data.error ?? 'Error validando sesión');
          if (!isDev) {
            setTimeout(() => {
              void router.push('/');
            }, 3000);
          }
          return;
        }

        setSession(data.session ?? null);
        setError(null);
      } catch {
        setError('Error validando sesión');
        if (!isDev) {
          setTimeout(() => {
            void router.push('/');
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, tenantId, router]);

  const logout = () => {
    void (async () => {
      try {
        await fetch('/api/admin/auth', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error('Error cerrando sesión:', error);
      } finally {
        void router.push('/');
      }
    })();
  };

  const contextValue: AdminContextType = {
    session,
    loading,
    error,
    logout,
    tenantId,
  };

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

interface AdminContextType {
  session: AdminSession | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  tenantId: string;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
};
