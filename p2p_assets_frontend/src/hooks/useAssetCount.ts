/**
 * Custom Hook: useAssetCount
 * Enterprise-level hook for fetching asset count with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import type { AssetRegisterParams } from '../types';

export interface UseAssetCountReturn {
  count: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAssetCount = (params?: AssetRegisterParams | null): UseAssetCountReturn => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getAssetCount(params ?? undefined);
      setCount(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset count');
      console.error('Error in useAssetCount:', err);
    } finally {
      setLoading(false);
    }
  }, [
    params?.search,
    params?.divisionCode,
    params?.branchCode,
    params?.serviceCode,
    params?.categoryId,
    params?.subcategoryId,
    params?.country,
    params?.state,
    params?.city,
    params?.status,
    params?.fromDate,
    params?.toDate,
  ]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return {
    count,
    loading,
    error,
    refetch: fetchCount,
  };
};
