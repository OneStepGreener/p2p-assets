/**
 * Cascading filter bar for Asset Register: Country -> State -> City -> Division -> Branch -> Category.
 * On parent change, child dropdowns reset and table reloads automatically.
 */

import React, { useCallback, useEffect } from 'react';
import { useRegisterFilters } from '../../hooks/useRegisterFilters';
import { RegisterFilterState } from '../../types';
import { AssetRegisterParams } from '../../types';

const ALL = '';

export interface RegisterFilterBarProps {
  companyCode?: string;
  defaultAssetClass?: string;
  onFilterChange: (params: Partial<AssetRegisterParams>) => void;
}

export const RegisterFilterBar: React.FC<RegisterFilterBarProps> = ({
  companyCode,
  defaultAssetClass = '',
  onFilterChange,
}) => {
  const {
    filters,
    setFilters,
    countries,
    states,
    cities,
    divisions,
    branches,
    categories,
    loading,
    resetFilters,
  } = useRegisterFilters({
    companyCode,
    initialFilters: { assetClass: defaultAssetClass },
  });

  // Sync current filters to register API params whenever they change
  const toRegisterParams = useCallback(
    (f: RegisterFilterState): Partial<AssetRegisterParams> => ({
      ...(f.country ? { country: f.country } : {}),
      ...(f.state ? { state: f.state } : {}),
      ...(f.city ? { city: f.city } : {}),
      ...(f.divisionCode ? { divisionCode: f.divisionCode } : {}),
      ...(f.branchCode ? { branchCode: f.branchCode } : {}),
      ...(f.assetClass ? { serviceCode: f.assetClass } : {}),
      ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    }),
    []
  );

  useEffect(() => {
    onFilterChange(toRegisterParams(filters));
  }, [filters, onFilterChange, toRegisterParams]);

  const handleCountryChange = (value: string) => {
    setFilters({
      country: value,
      state: '',
      city: '',
      branchCode: '',
    });
  };

  const handleStateChange = (value: string) => {
    setFilters({ state: value, city: '' });
  };

  const handleDivisionChange = (value: string) => {
    setFilters({ divisionCode: value, branchCode: '' });
  };

  const handleAssetClassChange = (value: string) => {
    setFilters({ assetClass: value, categoryId: '' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Country</label>
          <select
            value={filters.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="input-field text-sm min-w-[140px]"
            disabled={loading.countries}
          >
            <option value={ALL}>All</option>
            {countries.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.countryName || c.countryCode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">State</label>
          <select
            value={filters.state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="input-field text-sm min-w-[120px]"
            disabled={loading.states || !filters.country}
          >
            <option value={ALL}>All</option>
            {states.map((s) => (
              <option key={s.stateCode} value={s.stateCode}>
                {s.stateCode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">City</label>
          <select
            value={filters.city}
            onChange={(e) => setFilters({ city: e.target.value })}
            className="input-field text-sm min-w-[120px]"
            disabled={loading.cities || !filters.country}
          >
            <option value={ALL}>All</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Division</label>
          <select
            value={filters.divisionCode}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className="input-field text-sm min-w-[140px]"
            disabled={loading.divisions}
          >
            <option value={ALL}>All</option>
            {divisions.map((d) => (
              <option key={d.divisionCode} value={d.divisionCode}>
                {d.divisionName || d.divisionCode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Branch</label>
          <select
            value={filters.branchCode}
            onChange={(e) => setFilters({ branchCode: e.target.value })}
            className="input-field text-sm min-w-[140px]"
            disabled={loading.branches || !filters.divisionCode}
          >
            <option value={ALL}>All</option>
            {branches.map((b) => (
              <option key={b.branchCode} value={b.branchCode}>
                {b.branchName || b.branchCode} {b.city ? `(${b.city})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Asset Class</label>
          <input
            type="text"
            value={filters.assetClass}
            onChange={(e) => handleAssetClassChange(e.target.value)}
            placeholder="e.g. 70006"
            className="input-field text-sm w-24"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Category</label>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ categoryId: e.target.value })}
            className="input-field text-sm min-w-[140px]"
            disabled={loading.categories || !filters.assetClass}
          >
            <option value={ALL}>All</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName || c.categoryId}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
};
