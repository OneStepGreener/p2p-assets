/**
 * Custom Hook: useAssetKPIs
 * Enterprise-level hook for fetching asset KPIs with loading and error states
 */

import { useState, useEffect } from 'react';
import { assetService, AssetKPIs } from '../services/assetService';

export interface UseAssetKPIsReturn {
  kpis: AssetKPIs | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAssetKPIs = (): UseAssetKPIsReturn => {
  const [kpis, setKpis] = useState<AssetKPIs | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getAssetKPIs();
      setKpis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset KPIs');
      console.error('Error in useAssetKPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  return {
    kpis,
    loading,
    error,
    refetch: fetchKPIs,
  };
};
