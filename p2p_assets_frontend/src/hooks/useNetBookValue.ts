/**
 * Custom Hook: useNetBookValue
 * Fetches net book value; optional params filter like register
 */

import { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import type { AssetRegisterParams } from '../types';

export interface UseNetBookValueReturn {
  netBookValue: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNetBookValue = (params?: AssetRegisterParams | null): UseNetBookValueReturn => {
  const [netBookValue, setNetBookValue] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetBookValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getNetBookValue(params ?? undefined);
      setNetBookValue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch net book value');
      console.error('Error in useNetBookValue:', err);
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
    fetchNetBookValue();
  }, [fetchNetBookValue]);

  return {
    netBookValue,
    loading,
    error,
    refetch: fetchNetBookValue,
  };
};
