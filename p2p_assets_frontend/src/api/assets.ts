import { api } from './axios';
import { API_CONFIG } from '../config/api';
import type { AssetRegisterRow } from '../types';

export interface AssetsResponse {
  data: AssetRegisterRow[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export interface AssetsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'assetId' | 'assetName' | 'acquisitionDate' | 'cost' | 'status';
  sortDir?: 'asc' | 'desc';
}

export async function getAssets(params: AssetsParams = {}): Promise<AssetsResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 20));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  const qs = searchParams.toString();
  const url = `${API_CONFIG.API_VERSION}/assets${qs ? `?${qs}` : ''}`;
  const { data } = await api.get(url);
  // Backend may return { data: [...] } or legacy { data: { assets, pagination } }
  const list = Array.isArray(data?.data)
    ? data.data
    : (data?.data as { assets?: AssetRegisterRow[] })?.assets ?? [];
  return {
    data: list,
    page: data?.page ?? (data?.data as { pagination?: { page?: number } })?.pagination?.page ?? 1,
    pageSize: data?.pageSize ?? (data?.data as { pagination?: { per_page?: number } })?.pagination?.per_page ?? 20,
    totalRows: data?.totalRows ?? (data?.data as { pagination?: { total?: number } })?.pagination?.total ?? 0,
  };
}

/** Download export file (CSV or XLSX) using fetch with Bearer token so backend applies role filter */
export async function downloadExport(
  format: 'csv' | 'xlsx',
  params: { search?: string; sortBy?: string; sortDir?: string } = {}
): Promise<void> {
  const base = `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/assets/export`;
  const searchParams = new URLSearchParams({ format });
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir ?? 'asc');
  const token = localStorage.getItem('access_token');
  const url = `${base}?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(res.statusText || 'Export failed');
  const blob = await res.blob();
  const filename = format === 'csv' ? 'assets_register.csv' : 'assets_register.xlsx';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
