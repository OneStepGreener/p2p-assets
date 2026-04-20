/**
 * Single request for Asset Dashboard KPIs (same filters as register; idle_* uses status=Idle server-side).
 */

import { useState, useEffect, useCallback } from 'react';
import { assetService, type DashboardKpis } from '../services/assetService';
import type { AssetRegisterParams } from '../types';

export interface UseDashboardKpisReturn extends DashboardKpis {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const empty: DashboardKpis = {
  count: 0,
  idleCount: 0,
  totalCost: 0,
  idleTotalCost: 0,
  netBookValue: 0,
};

export function useDashboardKpis(params?: AssetRegisterParams | null): UseDashboardKpisReturn {
  const [data, setData] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await assetService.getDashboardKpis(params ?? undefined);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard KPIs';
      setError(message);
      console.error('Error in useDashboardKpis:', err);
    } finally {
      setLoading(false);
    }
  }, [
    params?.search,
    params?.country,
    params?.state,
    params?.city,
    params?.companyCode,
    params?.divCode,
    params?.divisionCode,
    params?.regionCode,
    params?.branchCode,
    params?.serviceCode,
    params?.categoryId,
    params?.subcategoryId,
    params?.status,
    params?.fromDate,
    params?.toDate,
  ]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  const merged = data ?? empty;

  return {
    count: merged.count,
    idleCount: merged.idleCount,
    totalCost: merged.totalCost,
    idleTotalCost: merged.idleTotalCost,
    netBookValue: merged.netBookValue,
    loading,
    error,
    refetch: fetchKpis,
  };
}
