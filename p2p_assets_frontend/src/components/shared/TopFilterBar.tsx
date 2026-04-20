/**
 * Top filter bar template: All Time, Division -> Branch -> Category, Reset.
 * Uses API-backed cascading dropdowns; drives asset register when onFilterChange (register params) is provided.
 */

import React, { useCallback, useEffect } from 'react';
import { FilterState } from '../../types';
import { AssetRegisterParams } from '../../types';
import { useRegisterFilters } from '../../hooks/useRegisterFilters';
import { RegisterFilterState } from '../../types';

const ALL = 'All';

export interface TopFilterBarProps {
  /** Legacy: for tabs that don't use hierarchy */
  filters?: FilterState;
  onFilterChange?: (filters: Partial<FilterState>) => void;
  onResetFilters?: () => void;
  locations?: string[];
  /** Hierarchy mode: drives asset register */
  companyCode?: string;
  defaultAssetClass?: string;
  onRegisterFilterChange?: (params: Partial<AssetRegisterParams>) => void;
}

const selectClass =
  'border-0 bg-transparent text-sm md:text-base text-gray-700 font-medium focus:outline-none focus:ring-0 cursor-pointer min-w-[100px]';

export const TopFilterBar: React.FC<TopFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  locations: locationsProp,
  companyCode,
  defaultAssetClass = '70002',
  onRegisterFilterChange,
}) => {
  const useHierarchy = Boolean(onRegisterFilterChange);

  const {
    filters: hierarchyFilters,
    setFilters: setHierarchyFilters,
    divisions,
    branches,
    categories,
    loading,
    resetFilters: resetHierarchy,
  } = useRegisterFilters({
    companyCode: companyCode || '',
    initialFilters: { assetClass: defaultAssetClass },
  });

  const toRegisterParams = useCallback(
    (f: RegisterFilterState): Partial<AssetRegisterParams> => ({
      ...(f.divisionCode ? { divisionCode: f.divisionCode } : {}),
      ...(f.branchCode ? { branchCode: f.branchCode } : {}),
      ...(f.assetClass ? { serviceCode: f.assetClass } : {}),
      ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    }),
    []
  );

  useEffect(() => {
    if (useHierarchy && onRegisterFilterChange) {
      onRegisterFilterChange(toRegisterParams(hierarchyFilters));
    }
  }, [useHierarchy, hierarchyFilters, onRegisterFilterChange, toRegisterParams]);

  const handleDivisionChange = (value: string) => {
    setHierarchyFilters({ divisionCode: value, branchCode: '' });
  };
  const handleAssetClassChange = (value: string) => {
    setHierarchyFilters({ assetClass: value, categoryId: '' });
  };

  if (useHierarchy) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 flex-wrap">
          {/* All Time */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <select value="All Time" className={selectClass}>
              <option>All Time</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>Last Year</option>
            </select>
          </div>

          {/* Division */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <select
              value={hierarchyFilters.divisionCode || ALL}
              onChange={(e) => handleDivisionChange(e.target.value === ALL ? '' : e.target.value)}
              className={selectClass}
              disabled={loading.divisions}
            >
              <option value={ALL}>All Divisions</option>
              {divisions.map((d) => (
                <option key={d.divisionCode} value={d.divisionCode}>
                  {d.divisionName || d.divisionCode}
                </option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <select
              value={hierarchyFilters.branchCode || ALL}
              onChange={(e) => setHierarchyFilters({ branchCode: e.target.value === ALL ? '' : e.target.value })}
              className={selectClass}
              disabled={loading.branches || !hierarchyFilters.divisionCode}
            >
              <option value={ALL}>All Branches</option>
              {branches.map((b) => (
                <option key={b.branchCode} value={b.branchCode}>
                  {b.branchName || b.branchCode} {b.city ? `(${b.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <select
              value={hierarchyFilters.categoryId || ALL}
              onChange={(e) => setHierarchyFilters({ categoryId: e.target.value === ALL ? '' : e.target.value })}
              className={selectClass}
              disabled={loading.categories || !hierarchyFilters.assetClass}
            >
              <option value={ALL}>All Categories</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName || c.categoryId}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <div className="w-full md:w-auto md:ml-auto">
            <button
              onClick={resetHierarchy}
              className="w-full md:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span>Asset Class:</span>
          <input
            type="text"
            value={hierarchyFilters.assetClass}
            onChange={(e) => handleAssetClassChange(e.target.value)}
            placeholder="e.g. 70002"
            className="border border-gray-200 rounded px-2 py-1 w-20 text-gray-700"
          />
        </div>
      </div>
    );
  }

  // Legacy: original template when onRegisterFilterChange not provided
  const DEFAULT_LOCATIONS = [
    'All Locations',
    'Mumbai - Andheri Branch',
    'Gurugram - Sector 18 Branch',
    'Bengaluru - Whitefield Branch',
    'Chennai - Ambattur DC',
    'Kolkata - Central Warehouse',
  ];
  const locations = locationsProp && locationsProp.length > 0 ? ['All Locations', ...(locationsProp || [])] : DEFAULT_LOCATIONS;
  const departments = ['All...', 'IT', 'Finance', 'HR', 'Sales', 'Engineering', 'Operations', 'Marketing'];
  const categoriesLegacy = ['All Categories', 'Computers', 'Furniture', 'Vehicles', 'Office Equipment', 'IT Infrastructure'];
  const f = filters || { dateRange: { start: '', end: '' }, location: 'All', department: 'All', assetCategory: 'All', status: 'All', costCenter: 'All' };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <select value="All Time" className={selectClass}>
            <option>All Time</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Last Year</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <select
            value={f.location === 'All' ? 'All Locations' : f.location}
            onChange={(e) => onFilterChange?.({ location: e.target.value === 'All Locations' ? 'All' : e.target.value })}
            className={selectClass}
          >
            {locations.map((loc) => (
              <option key={loc} value={loc === 'All Locations' ? 'All' : loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <select
            value={f.department === 'All' ? 'All...' : f.department}
            onChange={(e) => onFilterChange?.({ department: e.target.value === 'All...' ? 'All' : e.target.value })}
            className={selectClass}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept === 'All...' ? 'All' : dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <select
            value={f.assetCategory === 'All' ? 'All Categories' : f.assetCategory}
            onChange={(e) => onFilterChange?.({ assetCategory: e.target.value === 'All Categories' ? 'All' : e.target.value })}
            className={selectClass}
          >
            {categoriesLegacy.map((cat) => (
              <option key={cat} value={cat === 'All Categories' ? 'All' : cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto md:ml-auto">
          <button
            onClick={onResetFilters}
            className="w-full md:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
