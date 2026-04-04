/**
 * Chart drill-down API: services -> categories -> subcategories.
 * All data from Oracle (srm_assets counts); JWT required.
 */
import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { ChartServiceItem, ChartCategoryItem, ChartSubcategoryItem } from '../types';

class ChartService {
  async getServices(topN: number = 20): Promise<ChartServiceItem[]> {
    const params = new URLSearchParams();
    if (topN >= 0) params.set('topN', String(topN));
    const url = `${API_ENDPOINTS.CHARTS.SERVICES}?${params.toString()}`;
    const response: ApiResponse<ChartServiceItem[]> = await apiClient.get(url);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to load services');
    return response.data;
  }

  async getCategories(serviceCode: string, topN: number = 10): Promise<ChartCategoryItem[]> {
    const params = new URLSearchParams();
    params.set('serviceCode', serviceCode);
    if (topN >= 0) params.set('topN', String(topN));
    const url = `${API_ENDPOINTS.CHARTS.CATEGORIES}?${params.toString()}`;
    const response: ApiResponse<ChartCategoryItem[]> = await apiClient.get(url);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to load categories');
    return response.data;
  }

  async getSubcategories(serviceCode: string, categoryId: string, topN: number = 15): Promise<ChartSubcategoryItem[]> {
    const params = new URLSearchParams();
    params.set('serviceCode', serviceCode);
    params.set('categoryId', categoryId);
    if (topN >= 0) params.set('topN', String(topN));
    const url = `${API_ENDPOINTS.CHARTS.SUBCATEGORIES}?${params.toString()}`;
    const response: ApiResponse<ChartSubcategoryItem[]> = await apiClient.get(url);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to load subcategories');
    return response.data;
  }
}

export const chartService = new ChartService();
