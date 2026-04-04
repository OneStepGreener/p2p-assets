import { useEffect, useState } from 'react';
import { assetService, CategoryCountsResponse } from '../services/assetService';

export function useCategoryCounts(serviceCode: string) {
  const [data, setData] = useState<CategoryCountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await assetService.getCategoryCounts(serviceCode));
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch category counts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!serviceCode) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceCode]);

  return { data, loading, error, refetch: fetchData };
}

