/**
 * Hook for Asset Transfers (SRM_ASSET_TRANSFERS).
 * Server-side search, filters, pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { allocationService } from '../services/allocationService';
import { AssetTransfer, AssetTransferParams } from '../types';

export interface UseAssetTransfersReturn {
  data: AssetTransfer[];
  totalRows: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (p: number) => void;
  setSearch: (s: string) => void;
  setFilters: (f: Partial<AssetTransferParams>) => void;
  params: AssetTransferParams;
}

const DEFAULT_PARAMS: AssetTransferParams = {
  page: 1,
  pageSize: 20,
};

export function useAssetTransfers(
  initialParams?: Partial<AssetTransferParams>
): UseAssetTransfersReturn {
  const [params, setParamsState] = useState<AssetTransferParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [data, setData] = useState<AssetTransfer[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPageState] = useState(params.page ?? 1);
  const [pageSize] = useState(params.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reqParams: AssetTransferParams = {
        ...params,
        page,
        pageSize,
      };
      const result = await allocationService.getAssetTransfers(reqParams);
      setData(result.data);
      setTotalRows(result.totalRows);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset transfers');
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [params, page, pageSize]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const refetch = useCallback(() => fetchTransfers(), [fetchTransfers]);

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, p));
  }, []);

  const setSearch = useCallback((s: string) => {
    setParamsState((prev) => ({ ...prev, search: s || undefined }));
    setPageState(1);
  }, []);

  const setFilters = useCallback((f: Partial<AssetTransferParams>) => {
    setParamsState((prev) => ({ ...prev, ...f }));
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
    setSearch,
    setFilters,
    params,
  };
}
