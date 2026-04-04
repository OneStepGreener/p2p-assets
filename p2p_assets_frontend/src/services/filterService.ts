/**
 * Filter dropdown APIs for Asset Register hierarchy.
 * Country -> State -> City -> Division -> Branch -> Category
 */

import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface CountryOption {
  countryCode: string;
  countryName: string;
}

export interface StateOption {
  stateCode: string;
}

export interface CityOption {
  city: string;
}

export interface DivisionOption {
  divisionCode: string;
  divisionName: string;
}

export interface BranchOption {
  branchCode: string;
  branchName: string;
  city: string;
}

export interface CategoryOption {
  categoryId: string;
  categoryName: string;
}

class FilterService {
  async getCountries(): Promise<CountryOption[]> {
    const res: ApiResponse<CountryOption[]> = await apiClient.get(API_ENDPOINTS.FILTERS.COUNTRIES);
    if (res.success && Array.isArray(res.data)) return res.data;
    return [];
  }

  async getStates(country: string): Promise<StateOption[]> {
    if (!country) return [];
    const url = `${API_ENDPOINTS.FILTERS.STATES}?country=${encodeURIComponent(country)}`;
    const res: ApiResponse<StateOption[]> = await apiClient.get(url);
    if (res.success && Array.isArray(res.data)) return res.data;
    return [];
  }

  async getCities(country: string, state: string): Promise<CityOption[]> {
    if (!country) return [];
    const params = new URLSearchParams({ country });
    if (state) params.append('state', state);
    const res: ApiResponse<CityOption[]> = await apiClient.get(
      `${API_ENDPOINTS.FILTERS.CITIES}?${params.toString()}`
    );
    if (res.success && Array.isArray(res.data)) return res.data;
    return [];
  }

  async getDivisions(companyCode?: string): Promise<DivisionOption[]> {
    const url = companyCode
      ? `${API_ENDPOINTS.FILTERS.DIVISIONS}?companyCode=${encodeURIComponent(companyCode)}`
      : API_ENDPOINTS.FILTERS.DIVISIONS;
    const res: ApiResponse<DivisionOption[]> = await apiClient.get(url);
    if (res.success && Array.isArray(res.data)) return res.data;
    return [];
  }

  async getBranches(divisionCode: string): Promise<BranchOption[]> {
    if (!divisionCode) return [];
    const url = `${API_ENDPOINTS.FILTERS.BRANCHES}?divisionCode=${encodeURIComponent(divisionCode)}`;
    const res: ApiResponse<BranchOption[]> = await apiClient.get(url);
    if (res.success && Array.isArray(res.data)) return res.data;
    return [];
  }

  async getCategories(assetClass: string): Promise<CategoryOption[]> {
    if (!assetClass) return [];
    const url = `${API_ENDPOINTS.FILTERS.CATEGORIES}?assetClass=${encodeURIComponent(assetClass)}`;
    const res: ApiResponse<CategoryOption[]> = await apiClient.get(url);
    if (res.success && Array.isArray(res.data)) return res.data;
    return [];
  }
}

export const filterService = new FilterService();
