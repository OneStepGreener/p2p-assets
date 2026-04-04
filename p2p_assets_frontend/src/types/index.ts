export interface Asset {
  id: string;
  name: string;
  description: string;
  category: string;
  class: string;
  location: string;
  department: string;
  status: 'Active' | 'Idle' | 'Under Maintenance' | 'Disposed';
  currentUser?: string;
  owner?: string;
  vendor: string;
  acquisitionDate: string;
  cost: number;
  netBookValue: number;
  warrantyExpiry?: string;
  amcExpiry?: string;
  costCenter: string;
  lastMovementDate?: string;
}

/** TLOG user from login / auth/me */
export interface User {
  emp_code: string;
  emp_name: string;
  emp_div: string;
  emp_branch: string;
  emp_region: string;
  role: 'ADMIN' | 'USER';
}

/** Asset Register row from GET /api/v1/assets or /register */
export interface AssetRegisterRow {
  assetId: string;
  assetName: string;
  divisionName?: string;
  branchName?: string;
  city?: string;
  state?: string;
  country?: string;
  regionCode?: string;
  categoryName?: string;
  subcategoryName?: string;
  locationName?: string;
  departmentName?: string;
  serviceDesc?: string;
  status: string;
  currentUser?: string;
  vendor: string;
  acquisitionDate: string;
  putToUseDate?: string;
  poNo?: string;
  invNo?: string;
  cost: number;
  totalCost?: number;
  accumDep?: number;
  netBookValue: number;
  warrantyExpiry?: string;
  amcExpiry?: string;
  raw?: Record<string, unknown>;
}

/** Query params for Asset Register and export */
export interface AssetRegisterParams {
  search?: string;
  country?: string;
  state?: string;
  city?: string;
  companyCode?: string;
  divCode?: string;
  divisionCode?: string;
  regionCode?: string;
  branchCode?: string;
  serviceCode?: string;
  categoryId?: string;
  subcategoryId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/** Hierarchy filter state for Asset Register (cascading dropdowns) */
export interface RegisterFilterState {
  country: string;
  state: string;
  city: string;
  divisionCode: string;
  branchCode: string;
  assetClass: string;
  categoryId: string;
}

export interface AuditRun {
  id: string;
  period: string;
  location: string;
  department: string;
  assignedAuditor: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  completionPercent: number;
  assetsPlanned: number;
  assetsScanned: number;
  discrepancies: number;
}

export interface AssetScan {
  assetId: string;
  assetDescription: string;
  expectedLocation: string;
  scannedLocation: string;
  condition: 'Good' | 'Minor Damage' | 'Major Damage' | 'Non-Functional';
  found: boolean;
  discrepancyFlag: boolean;
  lastScanTimestamp: string;
}

export interface Discrepancy {
  ticketId: string;
  assetId: string;
  assetDescription: string;
  department: string;
  location: string;
  severity: 'High' | 'Medium' | 'Low';
  discrepancyType: 'Missing' | 'Misplaced' | 'Documentation Error' | 'Condition Mismatch';
  status: 'Awaiting Investigation' | 'In Investigation' | 'Pending Approval' | 'Resolved';
  owner: string;
  outcome?: 'Found Relocated' | 'Lost or Stolen' | 'Documentation Error';
  comments?: string;
  attachments?: string[];
}

export interface AssetMovement {
  id: string;
  assetId: string;
  fromLocation: string;
  toLocation: string;
  fromDepartment: string;
  toDepartment: string;
  date: string;
  approver: string;
  reason?: string;
}

/** Asset Transfer from SRM_ASSET_TRANSFERS table */
export interface AssetTransfer {
  transferId: string;
  assetTagId: string;
  fromLocation: string;
  toLocation: string;
  fromDepartment: string;
  toDepartment: string;
  transferDate: string;
  transferStatus: string;
  transferReason: string;
  approvedBy: string;
  requestedBy: string;
  createdDate: string;
  updatedDate: string;
}

/** Query params for Asset Transfers */
export interface AssetTransferParams {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  location: string;
  department: string;
  assetCategory: string;
  status: string;
  costCenter: string;
  auditor?: string;
  discrepancySeverity?: string;
  discrepancyStatus?: string;
}

export interface KPICard {
  title: string;
  value: string | number;
  secondaryValue?: string;
  change?: number;
  icon: string;
  color: string;
}

/** Chart drill-down: Level 1 – services */
export interface ChartServiceItem {
  serviceCode: string;
  serviceDesc: string;
  assetCount: number;
}

/** Chart drill-down: Level 2 – categories for a service */
export interface ChartCategoryItem {
  categoryId: string;
  categoryName: string;
  assetCount: number;
}

/** Chart drill-down: Level 3 – subcategories for a service+category */
export interface ChartSubcategoryItem {
  subCategoryId: string;
  subCategoryName: string;
  assetCount: number;
}
