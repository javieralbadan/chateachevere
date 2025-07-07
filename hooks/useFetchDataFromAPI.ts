'use client';
import fallbackDataImport from '@/data/fallback-data';
import { ValidEndpoint, EndpointDataMap } from '@/data/types';
import { useEffect, useState } from 'react';

const isDev = process.env.NODE_ENV === 'development';
const fallbackData = fallbackDataImport as EndpointDataMap;
const clientCache = new Map<string, unknown>();

const useFetchData = <T extends ValidEndpoint>(endpoint: T) => {
  const [data, setData] = useState<EndpointDataMap[T]>(
    (clientCache.get(endpoint) as EndpointDataMap[T]) || fallbackData[endpoint],
  );
  const [loading, setLoading] = useState<boolean>(!clientCache.has(endpoint));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientCache.has(endpoint)) {
      if (isDev) console.log(`📦 [${endpoint}]: Usando caché del cliente`);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/data/${endpoint}`);
        if (!response.ok) {
          throw new Error('Error en la API');
        }

        const remoteData = (await response.json()) as EndpointDataMap[T];
        const dataSource = (response.headers.get('X-Data-Source') as 'gist' | 'fallback') || 'gist';

        clientCache.set(endpoint, remoteData);
        setData(remoteData);

        if (isDev) {
          const icon = dataSource === 'fallback' ? '⚠️' : '✅';
          console.log(`${icon} [${endpoint}]: Datos cargados desde ${dataSource}`);
        }
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError(`Error al cargar ${endpoint}. Usando datos locales.`);
        setData(fallbackData[endpoint]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [endpoint]);

  return { data, loading, error };
};

export default useFetchData;
