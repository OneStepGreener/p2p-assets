/**
 * Allocation Service
 * Service for asset transfer-related API calls (SRM_ASSET_TRANSFERS)
 */

import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { AssetTransfer, AssetTransferParams } from '../types';

export interface AssetTransfersResponse {
  data: AssetTransfer[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export interface TransferCountResponse {
  count: number;
}

class AllocationService {
  /**
   * Get paginated asset transfers
   */
  async getAssetTransfers(params?: AssetTransferParams): Promise<AssetTransfersResponse> {
    try {
      const queryParams = params ? this._paramsToQuery(params) : '';
      const url = queryParams
        ? `${API_ENDPOINTS.ALLOCATIONS.LIST}?${queryParams}`
        : API_ENDPOINTS.ALLOCATIONS.LIST;
      
      const response = await apiClient.get<AssetTransfersResponse>(url);
      if (response.success && response.data) {
        return {
          data: Array.isArray(response.data) ? response.data : [],
          page: (response as any).page ?? 1,
          pageSize: (response as any).pageSize ?? 20,
          totalRows: (response as any).totalRows ?? 0,
        };
      }
      throw new Error(response.message || 'Failed to get asset transfers');
    } catch (error: any) {
      console.error('Error fetching asset transfers:', error);
      throw error;
    }
  }

  /**
   * Get transfer count
   */
  async getTransferCount(params?: AssetTransferParams): Promise<number> {
    try {
      const queryParams = params ? this._paramsToQuery(params) : '';
      const url = queryParams
        ? `${API_ENDPOINTS.ALLOCATIONS.COUNT}?${queryParams}`
        : API_ENDPOINTS.ALLOCATIONS.COUNT;
      
      const response: ApiResponse<TransferCountResponse> = await apiClient.get(url);
      if (response.success && response.data) return response.data.count;
      throw new Error(response.message || 'Failed to get transfer count');
    } catch (error: any) {
      console.error('Error fetching transfer count:', error);
      throw error;
    }
  }

  /**
   * Get movement history for a specific asset
   */
  async getAssetMovements(assetTagId: string): Promise<AssetTransfer[]> {
    try {
      const response: ApiResponse<AssetTransfer[]> = await apiClient.get(
        API_ENDPOINTS.ALLOCATIONS.MOVEMENTS(assetTagId)
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.message || 'Failed to get asset movements');
    } catch (error: any) {
      console.error('Error fetching asset movements:', error);
      throw error;
    }
  }

  /**
   * Get a single transfer by ID
   */
  async getTransferById(transferId: string): Promise<AssetTransfer | null> {
    try {
      const response: ApiResponse<AssetTransfer> = await apiClient.get(
        API_ENDPOINTS.ALLOCATIONS.BY_ID(transferId)
      );
      if (response.success && response.data) return response.data;
      return null;
    } catch (error: any) {
      console.error('Error fetching transfer by ID:', error);
      return null;
    }
  }

  /**
   * Approve a transfer (sets APPROVED_BY on backend).
   */
  async approveTransfer(transferId: string): Promise<AssetTransfer> {
    try {
      const response = await apiClient.post<AssetTransfer>(
        API_ENDPOINTS.ALLOCATIONS.APPROVE(transferId),
        {}
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to approve transfer');
    } catch (error: any) {
      console.error('Error approving transfer:', error);
      throw error;
    }
  }

  private _paramsToQuery(params: AssetTransferParams): string {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params.toDate) searchParams.set('toDate', params.toDate);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    return searchParams.toString();
  }
}

export const allocationService = new AllocationService();
