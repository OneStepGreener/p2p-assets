const SERVER_BASE_URL = 'https://reactapp.tcil.in/aiml/p2p_assets';
const LOCAL_BASE_URL = 'http://localhost:5000/aiml/p2p_assets';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? LOCAL_BASE_URL : SERVER_BASE_URL);

const API_VERSION = '/api/v1';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  API_VERSION: API_VERSION,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}${API_VERSION}/auth/login`,
    REGISTER: `${API_BASE_URL}${API_VERSION}/auth/register`,
    REFRESH: `${API_BASE_URL}${API_VERSION}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}${API_VERSION}/auth/logout`,
    ME: `${API_BASE_URL}${API_VERSION}/auth/me`,
  },
  // Asset endpoints
  ASSETS: {
    BASE: `${API_BASE_URL}${API_VERSION}/assets`,
    COUNT: `${API_BASE_URL}${API_VERSION}/assets/count`,
    KPIS: `${API_BASE_URL}${API_VERSION}/assets/kpis`,
    TOTAL_COST: `${API_BASE_URL}${API_VERSION}/assets/total-cost`,
    NET_BOOK_VALUE: `${API_BASE_URL}${API_VERSION}/assets/net-book-value`,
    CATEGORY_COUNTS: `${API_BASE_URL}${API_VERSION}/assets/category-counts`,
    LOCATIONS: `${API_BASE_URL}${API_VERSION}/assets/locations`,
    REGISTER: `${API_BASE_URL}${API_VERSION}/assets/register`,
    MARK_IDLE: `${API_BASE_URL}${API_VERSION}/assets/mark-idle`,
    MARK_ACTIVE: `${API_BASE_URL}${API_VERSION}/assets/mark-active`,
    TRANSFER: `${API_BASE_URL}${API_VERSION}/assets/transfer`,
    EXPORT: `${API_BASE_URL}${API_VERSION}/assets/export`,
    LIST: `${API_BASE_URL}${API_VERSION}/assets`,
    BY_ID: (id: string) => `${API_BASE_URL}${API_VERSION}/assets/${id}`,
  },
  // Audit endpoints
  AUDITS: {
    BASE: `${API_BASE_URL}${API_VERSION}/audits`,
    LIST: `${API_BASE_URL}${API_VERSION}/audits`,
    BY_ID: (id: string) => `${API_BASE_URL}${API_VERSION}/audits/${id}`,
  },
  // Discrepancy endpoints
  DISCREPANCIES: {
    BASE: `${API_BASE_URL}${API_VERSION}/discrepancies`,
    LIST: `${API_BASE_URL}${API_VERSION}/discrepancies`,
    BY_ID: (id: string) => `${API_BASE_URL}${API_VERSION}/discrepancies/${id}`,
  },
  // Allocation endpoints
  ALLOCATIONS: {
    BASE: `${API_BASE_URL}${API_VERSION}/allocations`,
    LIST: `${API_BASE_URL}${API_VERSION}/allocations`,
    COUNT: `${API_BASE_URL}${API_VERSION}/allocations/count`,
    MOVEMENTS: (assetTagId: string) => `${API_BASE_URL}${API_VERSION}/allocations/movements/${assetTagId}`,
    BY_ID: (transferId: string) => `${API_BASE_URL}${API_VERSION}/allocations/${transferId}`,
    APPROVE: (transferId: string) => `${API_BASE_URL}${API_VERSION}/allocations/${transferId}/approve`,
  },
  // Chart drill-down (services -> categories -> subcategories)
  CHARTS: {
    SERVICES: `${API_BASE_URL}${API_VERSION}/charts/services`,
    CATEGORIES: `${API_BASE_URL}${API_VERSION}/charts/categories`,
    SUBCATEGORIES: `${API_BASE_URL}${API_VERSION}/charts/subcategories`,
  },
  // Filter dropdowns for Asset Register hierarchy
  FILTERS: {
    COUNTRIES: `${API_BASE_URL}${API_VERSION}/filters/countries`,
    STATES: `${API_BASE_URL}${API_VERSION}/filters/states`,
    CITIES: `${API_BASE_URL}${API_VERSION}/filters/cities`,
    DIVISIONS: `${API_BASE_URL}${API_VERSION}/filters/divisions`,
    BRANCHES: `${API_BASE_URL}${API_VERSION}/filters/branches`,
    CATEGORIES: `${API_BASE_URL}${API_VERSION}/filters/categories`,
  },
} as const;
