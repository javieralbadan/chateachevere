'use client';
import { Result } from 'antd';
import { PropsWithChildren } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const isDev = process.env.NODE_ENV === 'development';

const ErrorFallback = ({ error }: { error: Error }) => {
  if (isDev) console.log('🚀 ~ error:', error);

  return (
    <div className="flex h-[calc(100vh-180px)] items-center justify-center">
      <Result
        status="500"
        title="Estamos investigando para volver lo más pronto posible"
        subTitle="Error al cargar el sitio"
      />
    </div>
  );
};

const ClientErrorBoundary: React.FC<PropsWithChildren> = ({ children }) => {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
};

export default ClientErrorBoundary;
