/**
 * Asset Service
 * Enterprise-level service for asset-related API calls
 */

import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { Asset, AssetRegisterRow, AssetRegisterParams } from '../types';

export interface AssetKPIs {
  total_active_assets: number;
  total_assets: number;
  total_gross_value?: number;
}

export interface AssetCountResponse {
  count: number;
}

export interface TotalCostResponse {
  total_cost: number;
}

export interface NetBookValueResponse {
  net_book_value: number;
}

/** Response from GET /assets/dashboard-kpis (snake_case from API) */
export interface DashboardKpisApiData {
  count: number;
  idle_count: number;
  total_cost: number;
  idle_total_cost: number;
  net_book_value: number;
}

export interface DashboardKpis {
  count: number;
  idleCount: number;
  totalCost: number;
  idleTotalCost: number;
  netBookValue: number;
}

export interface CategoryCountItem {
  category: string;
  count: number;
  percentage: number;
}

export interface CategoryCountsResponse {
  service_code: string;
  total: number;
  items: CategoryCountItem[];
}

class AssetService {
  /**
   * Get asset count; optional params filter like register (division, branch, search, etc.)
   */
  async getAssetCount(params?: AssetRegisterParams): Promise<number> {
    try {
      const url = params ? `${API_ENDPOINTS.ASSETS.COUNT}?${this._registerParamsToQuery(params)}` : API_ENDPOINTS.ASSETS.COUNT;
      const response: ApiResponse<AssetCountResponse> = await apiClient.get(url);
      if (response.success && response.data) return response.data.count;
      throw new Error(response.message || 'Failed to get asset count');
    } catch (error: any) {
      console.error('Error fetching asset count:', error);
      throw error;
    }
  }

  private _registerParamsToQuery(params: AssetRegisterParams): string {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.country) searchParams.append('country', params.country);
    if (params?.state) searchParams.append('state', params.state);
    if (params?.city) searchParams.append('city', params.city);
    if (params?.companyCode) searchParams.append('companyCode', params.companyCode);
    if (params?.divCode) searchParams.append('divCode', params.divCode);
    if (params?.divisionCode) searchParams.append('divisionCode', params.divisionCode);
    if (params?.regionCode) searchParams.append('regionCode', params.regionCode);
    if (params?.branchCode) searchParams.append('branchCode', params.branchCode);
    if (params?.serviceCode) searchParams.append('serviceCode', params.serviceCode);
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params?.subcategoryId) searchParams.append('subcategoryId', params.subcategoryId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params?.toDate) searchParams.append('toDate', params.toDate);
    return searchParams.toString();
  }

  /**
   * Get asset KPIs
   */
  async getAssetKPIs(): Promise<AssetKPIs> {
    try {
      const response: ApiResponse<AssetKPIs> = await apiClient.get(
        API_ENDPOINTS.ASSETS.KPIS
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get asset KPIs');
    } catch (error: any) {
      console.error('Error fetching asset KPIs:', error);
      throw error;
    }
  }

  /**
   * Get total cost sum; optional params filter like register
   */
  async getTotalCost(params?: AssetRegisterParams): Promise<number> {
    try {
      const url = params ? `${API_ENDPOINTS.ASSETS.TOTAL_COST}?${this._registerParamsToQuery(params)}` : API_ENDPOINTS.ASSETS.TOTAL_COST;
      const response: ApiResponse<TotalCostResponse> = await apiClient.get(url);
      if (response.success && response.data) return response.data.total_cost;
      throw new Error(response.message || 'Failed to get total cost');
    } catch (error: any) {
      console.error('Error fetching total cost:', error);
      throw error;
    }
  }

  /**
   * Get net book value; optional params filter like register
   */
  async getNetBookValue(params?: AssetRegisterParams): Promise<number> {
    try {
      const url = params ? `${API_ENDPOINTS.ASSETS.NET_BOOK_VALUE}?${this._registerParamsToQuery(params)}` : API_ENDPOINTS.ASSETS.NET_BOOK_VALUE;
      const response: ApiResponse<NetBookValueResponse> = await apiClient.get(url);
      if (response.success && response.data) return response.data.net_book_value;
      throw new Error(response.message || 'Failed to get net book value');
    } catch (error: any) {
      console.error('Error fetching net book value:', error);
      throw error;
    }
  }

  /**
   * Aggregated dashboard KPIs (one request: count, idle metrics, costs, net book).
   */
  async getDashboardKpis(params?: AssetRegisterParams): Promise<DashboardKpis> {
    try {
      const url = params
        ? `${API_ENDPOINTS.ASSETS.DASHBOARD_KPIS}?${this._registerParamsToQuery(params)}`
        : API_ENDPOINTS.ASSETS.DASHBOARD_KPIS;
      const response: ApiResponse<DashboardKpisApiData> = await apiClient.get(url);
      if (response.success && response.data) {
        const d = response.data;
        return {
          count: d.count,
          idleCount: d.idle_count,
          totalCost: d.total_cost,
          idleTotalCost: d.idle_total_cost,
          netBookValue: d.net_book_value,
        };
      }
      throw new Error(response.message || 'Failed to get dashboard KPIs');
    } catch (error: any) {
      console.error('Error fetching dashboard KPIs:', error);
      throw error;
    }
  }

  /**
   * Get distinct locations (HO_COUNTRY_NAME from cm_division_tlog) for location filter
   */
  async getLocations(): Promise<string[]> {
    try {
      const response: ApiResponse<string[]> = await apiClient.get(
        API_ENDPOINTS.ASSETS.LOCATIONS
      );

      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }

  /**
   * Get Asset Register from srm_assets (single source of truth) with search, filters, pagination, sort
   */
  async getAssetRegister(params?: AssetRegisterParams): Promise<{
    data: AssetRegisterRow[];
    page: number;
    pageSize: number;
    totalRows: number;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.country) searchParams.append('country', params.country);
      if (params?.state) searchParams.append('state', params.state);
      if (params?.city) searchParams.append('city', params.city);
      if (params?.companyCode) searchParams.append('companyCode', params.companyCode);
      if (params?.divCode) searchParams.append('divCode', params.divCode);
      if (params?.divisionCode) searchParams.append('divisionCode', params.divisionCode);
      if (params?.regionCode) searchParams.append('regionCode', params.regionCode);
      if (params?.branchCode) searchParams.append('branchCode', params.branchCode);
      if (params?.serviceCode) searchParams.append('serviceCode', params.serviceCode);
      if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
      if (params?.subcategoryId) searchParams.append('subcategoryId', params.subcategoryId);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
      if (params?.toDate) searchParams.append('toDate', params.toDate);
      if (params?.page != null) searchParams.append('page', String(params.page));
      if (params?.pageSize != null) searchParams.append('pageSize', String(params.pageSize));
      if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params?.sortDir) searchParams.append('sortDir', params.sortDir);
      const url = `${API_ENDPOINTS.ASSETS.REGISTER}?${searchParams.toString()}`;
      const response = await apiClient.get<AssetRegisterRow[]>(url);
      if (!response.success) {
        throw new Error((response as any).message || 'Failed to get asset register');
      }
      const data = Array.isArray(response.data) ? response.data : [];
      const page = (response as any).page ?? params?.page ?? 1;
      const pageSize = (response as any).pageSize ?? params?.pageSize ?? 20;
      const totalRows = (response as any).totalRows ?? data.length;
      return { data, page, pageSize, totalRows };
    } catch (error: any) {
      console.error('Error fetching asset register:', error);
      throw error;
    }
  }

  /**
   * Mark an asset as idle; sends ASSET_REF_ID (assetId) and reason to backend (SRM_IDLE_ASSETS).
   */
  async markAssetIdle(assetId: string, reason: string): Promise<void> {
    const response = await apiClient.post<{ assetId: string }>(API_ENDPOINTS.ASSETS.MARK_IDLE, {
      assetId: assetId.trim(),
      reason: reason.trim(),
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark asset as idle');
    }
  }

  /**
   * Mark an asset as active; sets ASSET_STATUS = 'Active' in srm_assets.
   */
  async markAssetActive(assetId: string): Promise<void> {
    const response = await apiClient.post<{ assetId: string }>(API_ENDPOINTS.ASSETS.MARK_ACTIVE, {
      assetId: assetId.trim(),
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark asset as active');
    }
  }

  /**
   * Initiate asset transfer (calls SP_TRANSFER_ASSET: snapshot, log to SRM_ASSET_TRANSFERS, update asset location, status IN-TRANSIT).
   */
  async transferAsset(params: {
    assetId: string;
    destinationBranchCode: string;
    reason: string;
    remarks: string;
    refNo: string;
  }): Promise<void> {
    const response = await apiClient.post<{ assetId: string }>(API_ENDPOINTS.ASSETS.TRANSFER, {
      assetId: params.assetId.trim(),
      destinationBranchCode: params.destinationBranchCode.trim(),
      reason: params.reason.trim(),
      remarks: params.remarks.trim(),
      refNo: params.refNo.trim(),
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to initiate transfer');
    }
  }

  /**
   * Export Asset Register as CSV or XLSX (same filters as getAssetRegister)
   */
  async exportAssets(params: AssetRegisterParams, format: 'csv' | 'xlsx'): Promise<void> {
    const searchParams = new URLSearchParams();
    searchParams.append('format', format);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.country) searchParams.append('country', params.country);
    if (params?.state) searchParams.append('state', params.state);
    if (params?.city) searchParams.append('city', params.city);
    if (params?.companyCode) searchParams.append('companyCode', params.companyCode);
    if (params?.divCode) searchParams.append('divCode', params.divCode);
    if (params?.divisionCode) searchParams.append('divisionCode', params.divisionCode);
    if (params?.regionCode) searchParams.append('regionCode', params.regionCode);
    if (params?.branchCode) searchParams.append('branchCode', params.branchCode);
    if (params?.serviceCode) searchParams.append('serviceCode', params.serviceCode);
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params?.subcategoryId) searchParams.append('subcategoryId', params.subcategoryId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params?.toDate) searchParams.append('toDate', params.toDate);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir || 'asc');
    const url = `${API_ENDPOINTS.ASSETS.EXPORT}?${searchParams.toString()}`;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = { Accept: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(res.statusText || 'Export failed');
    const blob = await res.blob();
    const name = `assets_register.${format === 'csv' ? 'csv' : 'xlsx'}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /**
   * Get all assets from srm_assets table with pagination
   */
  async getAllAssets(filters?: {
    location?: string;
    department?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ assets: Asset[]; pagination: any }> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.location) params.append('location', filters.location);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.per_page) params.append('per_page', filters.per_page.toString());
      
      const url = `${API_ENDPOINTS.ASSETS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response: ApiResponse<{ assets: Asset[]; pagination: any }> = await apiClient.get(url);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get assets');
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  }

  /**
   * Get category counts (distinct subcategory count per category) for a service_code
   */
  async getCategoryCounts(serviceCode: string): Promise<CategoryCountsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('service_code', serviceCode);
      const url = `${API_ENDPOINTS.ASSETS.CATEGORY_COUNTS}?${params.toString()}`;

      const response: ApiResponse<CategoryCountsResponse> = await apiClient.get(url);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get category counts');
    } catch (error: any) {
      console.error('Error fetching category counts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const assetService = new AssetService();
