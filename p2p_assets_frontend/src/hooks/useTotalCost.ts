/**
 * Custom Hook: useTotalCost
 * Fetches total cost; optional params filter like register
 */

import { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import type { AssetRegisterParams } from '../types';

export interface UseTotalCostReturn {
  totalCost: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function filterKey(params: AssetRegisterParams | null | undefined): string {
  if (!params) return '';
  return JSON.stringify({
    search: params.search,
    divisionCode: params.divisionCode,
    branchCode: params.branchCode,
    serviceCode: params.serviceCode,
    categoryId: params.categoryId,
    subcategoryId: params.subcategoryId,
    country: params.country,
    state: params.state,
    city: params.city,
    status: params.status,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });
}

export const useTotalCost = (params?: AssetRegisterParams | null): UseTotalCostReturn => {
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalCost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getTotalCost(params ?? undefined);
      setTotalCost(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch total cost');
      console.error('Error in useTotalCost:', err);
    } finally {
      setLoading(false);
    }
  }, [filterKey(params)]);

  useEffect(() => {
    fetchTotalCost();
  }, [fetchTotalCost]);

  return {
    totalCost,
    loading,
    error,
    refetch: fetchTotalCost,
  };
};
