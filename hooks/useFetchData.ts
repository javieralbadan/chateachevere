'use client';
import fallbackDataImport from '@/data/fallback-data';
import { ValidEndpoint, EndpointDataMap } from '@/data/types';
import { useEffect, useState } from 'react';
import { DATA_SOURCE_MAP } from '@/utils/constants';
import { validators } from '@/data/validators';

const isDev = process.env.NODE_ENV === 'development';
const fallbackData = fallbackDataImport as EndpointDataMap;
const clientCache = new Map<string, unknown>();
const ongoingRequests = new Map<string, Promise<unknown>>();

async function fetchWithFallback<T extends ValidEndpoint>(
  endpoint: T,
): Promise<EndpointDataMap[T]> {
  try {
    const response = await fetch(DATA_SOURCE_MAP[endpoint], { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawData = (await response.json()) as EndpointDataMap[T];

    if (!(validators[endpoint] as (data: EndpointDataMap[T]) => boolean)(rawData)) {
      throw new Error(`Los datos de [${endpoint}] no tienen el formato esperado`);
    }

    if (isDev) console.log(`✅ [${endpoint}]: Loaded from Gist`);
    return rawData;
  } catch (error) {
    if (isDev) console.warn(`⚠️ [${endpoint}]: Using fallback`, error);
    return fallbackData[endpoint];
  }
}

const useFetchData = <T extends ValidEndpoint>(endpoint: T) => {
  const [data, setData] = useState<EndpointDataMap[T]>(
    (clientCache.get(endpoint) as EndpointDataMap[T]) || fallbackData[endpoint],
  );
  const [loading, setLoading] = useState(!clientCache.has(endpoint));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientCache.has(endpoint)) {
      if (isDev) console.log(`📦 [${endpoint}]: Using cache`);
      return;
    }

    if (!ongoingRequests.has(endpoint)) {
      const fetchPromise = fetchWithFallback(endpoint);
      ongoingRequests.set(endpoint, fetchPromise);
    }

    ongoingRequests
      .get(endpoint)!
      .then((result) => {
        clientCache.set(endpoint, result);
        setData(result as EndpointDataMap[T]);
      })
      .catch(() => {
        setError(`Error loading ${endpoint}`);
        setData(fallbackData[endpoint]);
      })
      .finally(() => {
        ongoingRequests.delete(endpoint);
        setLoading(false);
      });
  }, [endpoint]);

  return { data, loading, error };
};

export default useFetchData;
