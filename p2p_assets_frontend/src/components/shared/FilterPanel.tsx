import React from 'react';
import { FilterState } from '../../types';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  showLocation?: boolean;
  showDepartment?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
  showCostCenter?: boolean;
  showDateRange?: boolean;
  showAuditor?: boolean;
  showDiscrepancySeverity?: boolean;
  showDiscrepancyStatus?: boolean;
  /** Locations from API (distinct HO_COUNTRY_NAME). When provided, used for Location dropdown. */
  locations?: string[];
}

const DEFAULT_LOCATIONS = [
  'All',
  'Mumbai - Andheri Branch',
  'Gurugram - Sector 18 Branch',
  'Bengaluru - Whitefield Branch',
  'Chennai - Ambattur DC',
  'Kolkata - Central Warehouse',
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  showLocation = true,
  showDepartment = true,
  showCategory = true,
  showStatus = true,
  showCostCenter = true,
  showDateRange = true,
  showAuditor = false,
  showDiscrepancySeverity = false,
  showDiscrepancyStatus = false,
  locations: locationsProp,
}) => {
  const locations = locationsProp && locationsProp.length > 0 ? ['All', ...locationsProp] : DEFAULT_LOCATIONS;
  const departments = ['All', 'IT', 'Finance', 'HR', 'Sales', 'Engineering', 'Operations', 'Marketing'];
  const categories = ['All', 'Computers', 'Furniture', 'Vehicles', 'Office Equipment', 'IT Infrastructure'];
  const statuses = ['All', 'Active', 'Idle', 'Under Maintenance', 'Disposed'];
  const costCenters = ['All', 'CC-IT-001', 'CC-IT-002', 'CC-FIN-001', 'CC-HR-001', 'CC-SALES-001', 'CC-ENG-001', 'CC-OPS-001', 'CC-MKT-001'];
  const auditors = ['All', 'Amitabh Verma', 'Neha Krishnan'];
  const severities = ['All', 'High', 'Medium', 'Low'];
  const discrepancyStatuses = ['All', 'Awaiting Investigation', 'In Investigation', 'Pending Approval', 'Resolved'];

  return (
    <div className="filter-panel">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Filters</h3>
      <div className="space-y-3 md:space-y-4">
        {showDateRange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  onFilterChange({
                    dateRange: { ...filters.dateRange, start: e.target.value },
                  })
                }
                className="input-field text-sm"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  onFilterChange({
                    dateRange: { ...filters.dateRange, end: e.target.value },
                  })
                }
                className="input-field text-sm"
              />
            </div>
          </div>
        )}

        {showLocation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => onFilterChange({ location: e.target.value })}
              className="input-field text-sm"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDepartment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => onFilterChange({ department: e.target.value })}
              className="input-field text-sm"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Category
            </label>
            <select
              value={filters.assetCategory}
              onChange={(e) => onFilterChange({ assetCategory: e.target.value })}
              className="input-field text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {showStatus && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="input-field text-sm"
            >
              {statuses.map((stat) => (
                <option key={stat} value={stat}>
                  {stat}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCostCenter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Center
            </label>
            <select
              value={filters.costCenter}
              onChange={(e) => onFilterChange({ costCenter: e.target.value })}
              className="input-field text-sm"
            >
              {costCenters.map((cc) => (
                <option key={cc} value={cc}>
                  {cc}
                </option>
              ))}
            </select>
          </div>
        )}

        {showAuditor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auditor
            </label>
            <select
              value={filters.auditor || 'All'}
              onChange={(e) => onFilterChange({ auditor: e.target.value })}
              className="input-field text-sm"
            >
              {auditors.map((aud) => (
                <option key={aud} value={aud}>
                  {aud}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDiscrepancySeverity && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discrepancy Severity
            </label>
            <select
              value={filters.discrepancySeverity || 'All'}
              onChange={(e) => onFilterChange({ discrepancySeverity: e.target.value })}
              className="input-field text-sm"
            >
              {severities.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDiscrepancyStatus && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discrepancy Status
            </label>
            <select
              value={filters.discrepancyStatus || 'All'}
              onChange={(e) => onFilterChange({ discrepancyStatus: e.target.value })}
              className="input-field text-sm"
            >
              {discrepancyStatuses.map((stat) => (
                <option key={stat} value={stat}>
                  {stat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
