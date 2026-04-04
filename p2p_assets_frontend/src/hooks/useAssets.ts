/**
 * Custom Hook: useAssets
 * Enterprise-level hook for fetching assets list with loading and error states
 * Includes pagination support to prevent timeout errors
 */

import { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';
import { Asset, FilterState } from '../types';

export interface UseAssetsReturn {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useAssets = (filters?: Partial<FilterState>, page: number = 1, perPage: number = 200): UseAssetsReturn => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseAssetsReturn['pagination']>(null);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchAssets = async (pageNum: number = currentPage, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams: any = {
        page: pageNum,
        per_page: perPage,
      };
      
      if (filters?.location && filters.location !== 'All') {
        filterParams.location = filters.location;
      }
      if (filters?.department && filters.department !== 'All') {
        filterParams.department = filters.department;
      }
      if (filters?.status && filters.status !== 'All') {
        filterParams.status = filters.status;
      }
      
      const response = await assetService.getAllAssets(filterParams);
      
      if (append) {
        setAssets(prev => [...prev, ...response.assets]);
      } else {
        setAssets(response.assets);
      }
      
      setPagination(response.pagination);
      setCurrentPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assets');
      console.error('Error in useAssets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (pagination && pagination.has_next && !loading) {
      await fetchAssets(currentPage + 1, true);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchAssets(1, false);
  }, [filters?.location, filters?.department, filters?.status]);

  return {
    assets,
    loading,
    error,
    pagination,
    refetch: () => fetchAssets(1, false),
    loadMore,
  };
};
