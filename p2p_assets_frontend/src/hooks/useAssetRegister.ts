/**
 * Hook for Asset Register (srm_assets single source of truth).
 * Server-side search, filters, pagination, sort.
 */

import { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import { AssetRegisterRow, AssetRegisterParams } from '../types';

export interface UseAssetRegisterReturn {
  data: AssetRegisterRow[];
  totalRows: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (p: number) => void;
  setSort: (sortBy: string | undefined, sortDir: 'asc' | 'desc') => void;
  setSearch: (s: string) => void;
  setFilters: (f: Partial<AssetRegisterParams>) => void;
  params: AssetRegisterParams;
}

const DEFAULT_PARAMS: AssetRegisterParams = {
  page: 1,
  pageSize: 20,
  // Default sort: Acquisition Date (ASSET_CREATION_DATE) newest first
  sortBy: 'acquisitiondate',
  sortDir: 'desc',
};

export function useAssetRegister(initialParams?: Partial<AssetRegisterParams>): UseAssetRegisterReturn {
  const [params, setParamsState] = useState<AssetRegisterParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [data, setData] = useState<AssetRegisterRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPageState] = useState(params.page ?? 1);
  const [pageSize] = useState(params.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegister = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reqParams: AssetRegisterParams = {
        ...params,
        page,
        pageSize,
      };
      const result = await assetService.getAssetRegister(reqParams);
      setData(result.data);
      setTotalRows(result.totalRows);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset register');
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [params, page, pageSize]);

  // Refetch whenever filters (params), page or pageSize change so division/branch/etc. trigger refresh
  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  const refetch = useCallback(() => fetchRegister(), [fetchRegister]);

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, p));
  }, []);

  const setSort = useCallback((sortBy: string | undefined, sortDir: 'asc' | 'desc') => {
    setParamsState(prev => ({ ...prev, sortBy: sortBy ?? prev.sortBy, sortDir }));
    setPageState(1);
  }, []);

  const setSearch = useCallback((s: string) => {
    setParamsState(prev => ({ ...prev, search: s || undefined }));
    setPageState(1);
  }, []);

  const setFilters = useCallback((f: Partial<AssetRegisterParams>) => {
    setParamsState(prev => ({ ...prev, ...f }));
    setPageState(1);
  }, []);

  return {
    data,
    totalRows,
    page,
    pageSize,
    loading,
    error,
    refetch,
    setPage,
    setSort,
    setSearch,
    setFilters,
    params,
  };
}
