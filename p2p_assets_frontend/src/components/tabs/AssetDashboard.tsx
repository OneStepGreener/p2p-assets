import React, { useState, useCallback, useEffect } from 'react';
import { KPICard } from '../shared/KPICard';
import { DataTable, Column } from '../shared/DataTable';
import { TopFilterBar } from '../shared/TopFilterBar';
import { FilterState, AssetRegisterRow } from '../../types';
import type { AssetRegisterParams } from '../../types';
import { useDashboardKpis } from '../../hooks/useDashboardKpis';
import { useAssetRegister } from '../../hooks/useAssetRegister';
import { useLocations } from '../../hooks/useLocations';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Box, Clock, Settings, AlertCircle, DollarSign, TrendingUp } from '../icons';
import { assetService } from '../../services/assetService';
import { AssetDrilldownChart, type ChartSelection } from '../AssetDrilldownChart';
import { AssetQRCodeActions } from '../shared/AssetQRCodeActions';

export const AssetDashboard: React.FC<{ filters: FilterState; onFilterChange: (filters: Partial<FilterState>) => void }> = ({
  filters,
  onFilterChange,
}) => {
  const handleResetFilters = () => {
    onFilterChange({
      dateRange: {
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      location: 'All',
      department: 'All',
      assetCategory: 'All',
      status: 'All',
      costCenter: 'All',
    });
  };
  const [registerSearchInput, setRegisterSearchInput] = useState('');

  // Asset Register (srm_assets single source of truth) - server-side search, sort, pagination, hierarchy filters
  const register = useAssetRegister();

  const handleRegisterFilterChange = useCallback(
    (params: Partial<AssetRegisterParams>) => {
      register.setFilters(params);
    },
    [register.setFilters]
  );

  const handleChartSelectionChange = useCallback(
    (selection: ChartSelection | null) => {
      if (!selection) {
        handleRegisterFilterChange({
          serviceCode: undefined,
          categoryId: undefined,
          subcategoryId: undefined,
        });
        return;
      }
      handleRegisterFilterChange({
        serviceCode: selection.serviceCode,
        categoryId: selection.categoryId,
        subcategoryId: selection.subcategoryId,
      });
    },
    [handleRegisterFilterChange]
  );

  // Debounce register search (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      register.setSearch(registerSearchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [registerSearchInput, register.setSearch]);

  // KPI cards: single aggregated request (same filters as register; idle_* from server with status=Idle)
  const kpis = useDashboardKpis(register.params);
  const {
    count: apiAssetCount,
    idleCount: idleAssetCount,
    totalCost: apiTotalCost,
    idleTotalCost,
    netBookValue: apiNetBookValue,
    loading: kpiLoading,
    error: kpiError,
    refetch: refetchKpis,
  } = kpis;

  // Locations from cm_division_tlog (distinct HO_COUNTRY_NAME) for dashboard filter
  const { locations: apiLocations } = useLocations();

  // Use API data only, default to 0 if not available
  const totalActiveAssets = apiAssetCount ?? 0;
  const totalAssets = apiAssetCount ?? 0;
  const idleAssets = idleAssetCount ?? 0;
  const maintenanceAssets = 0;
  // Use API data for total cost, default to 0
  const totalAssetValue = apiTotalCost ?? 0;
  // Use API data for net book value (asset_total_cost - dep_amount_total), default to 0
  const netBookValue = apiNetBookValue ?? 0;
  const idlePercentage = totalAssets > 0 ? ((idleAssets / totalAssets) * 100).toFixed(1) : '0.0';
  
  // Format total cost for display in Indian Rupees
  const formatCurrency = (value: number): string => {
    if (value >= 10000000) {
      // For crores (1 crore = 10 million)
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      // For lakhs (1 lakh = 100 thousand)
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      // For thousands
      return `₹${(value / 1000).toFixed(2)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Warranty/AMC expiries - Set to 0
  const upcomingWarranty30 = 0;
  const upcomingWarranty60 = 0;

  // Status data removed - not used in current implementation

  // Maintenance overview - Set to 0
  const upcomingMaintenance7Days = 0;
  const overdueMaintenance = 0;
  const idleOver30Days = idleAssets;
  const idleValueAtRisk = idleTotalCost;

  // Asset Register columns (srm_assets) - keys map to backend sortBy in onSortRequest
  // Show Acquisition Date first so newest assets appear at the top.
  const registerColumns: Column<AssetRegisterRow>[] = [
    { key: 'acquisitionDate', label: 'Acquisition Date', sortable: true },
    { key: 'assetId', label: 'Asset ID', sortable: true },
    { key: 'assetName', label: 'Asset Name', sortable: true },
    { key: 'divisionName', label: 'Division', sortable: false },
    { key: 'branchName', label: 'Branch', sortable: false },
    { key: 'city', label: 'City', sortable: false },
    { key: 'state', label: 'State', sortable: false },
    { key: 'country', label: 'Country', sortable: false },
    { key: 'categoryName', label: 'Category', sortable: true },
    { key: 'subcategoryName', label: 'Subcategory', sortable: true },
    { key: 'locationName', label: 'Location', sortable: true },
    { key: 'departmentName', label: 'Department', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          Active: 'bg-green-100 text-green-800',
          Idle: 'bg-yellow-100 text-yellow-800',
          'Under Maintenance': 'bg-blue-100 text-blue-800',
          Disposed: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || ''}`}>
            {value || '-'}
          </span>
        );
      },
    },
    { key: 'acquisitionDate', label: 'Acquisition Date', sortable: true },
    {
      key: 'cost',
      label: 'Cost',
      sortable: true,
      render: (value) => formatCurrency(value ?? 0),
    },
    {
      key: 'netBookValue',
      label: 'Net Book Value',
      sortable: true,
      render: (value) => formatCurrency(value ?? 0),
    },
    {
      key: 'qrCode',
      label: '',
      sortable: false,
      render: (_value, row) => (
        <AssetQRCodeActions
          row={row}
          formatCurrency={formatCurrency}
          onMarkIdle={(assetId, reason) =>
            assetService.markAssetIdle(assetId, reason).then(async () => {
              handleRegisterFilterChange({ status: 'Idle' });
              await Promise.all([register.refetch(), refetchKpis()]);
            }).catch((err) => {
              console.error('Mark as idle failed:', err);
            })
          }
          onMarkActive={(assetId) =>
            assetService.markAssetActive(assetId).then(async () => {
              handleRegisterFilterChange({ status: 'Active' });
              await Promise.all([register.refetch(), refetchKpis()]);
            }).catch((err) => {
              console.error('Mark as active failed:', err);
            })
          }
          onTransfer={(params) =>
            assetService.transferAsset(params).then(async () => {
              await Promise.all([register.refetch(), refetchKpis()]);
            }).catch((err) => {
              console.error('Transfer failed:', err);
              throw err;
            })
          }
        />
      ),
    },
  ];

  const registerSortByMap: Record<string, string> = {
    assetId: 'asset_tag_id',
    assetName: 'item_name',
    // Acquisition Date -> ASSET_CREATION_DATE in Oracle (via API sort key)
    acquisitionDate: 'acquisitiondate',
    cost: 'asset_total_cost',
    status: 'asset_status',
  };

  const handleRegisterExport = useCallback(
    (format: 'csv' | 'excel') => {
      assetService.exportAssets(register.params, format === 'excel' ? 'xlsx' : 'csv').catch((err) => {
        console.error('Export failed:', err);
      });
    },
    [register.params]
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Filter Bar: All Time, Country -> State -> City -> Division -> Branch -> Category (template; drives register) */}
      <TopFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={handleResetFilters}
        locations={apiLocations}
        companyCode="1"
        defaultAssetClass="70002"
        onRegisterFilterChange={handleRegisterFilterChange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiError ? (
          <div className="col-span-1">
            <ErrorMessage message={kpiError} onRetry={() => void refetchKpis()} />
          </div>
        ) : (
        <KPICard
          title="Total Active Assets"
            value={kpiLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              totalActiveAssets
            )}
            secondaryValue={kpiLoading ? 'Loading...' : `of ${totalAssets} total`}
            change={kpiLoading ? undefined : 3.2}
          icon={<Box className="h-full w-full" />}
          color="bg-blue-100 text-blue-700"
          bgColor="bg-gradient-to-br from-blue-50 to-white"
        />
        )}
        <KPICard
          title="Idle Assets"
          value={kpiLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            idleAssets
          )}
          secondaryValue={kpiLoading ? 'Loading...' : `${idlePercentage}% of total`}
          change={-1.5}
          icon={<Clock className="h-full w-full" />}
          color="bg-orange-100 text-orange-700"
          bgColor="bg-gradient-to-br from-orange-50 to-white"
        />
        <KPICard
          title="Under Maintenance"
          value={maintenanceAssets}
          secondaryValue="0% stable"
          icon={<Settings className="h-full w-full" />}
          color="bg-blue-100 text-blue-700"
          bgColor="bg-gradient-to-br from-blue-50 to-white"
        />
        <KPICard
          title="Warranty Expiring"
          value={upcomingWarranty30}
          secondaryValue={`${upcomingWarranty60} in 60 days`}
          icon={<AlertCircle className="h-full w-full" />}
          color="bg-yellow-100 text-yellow-700"
          bgColor="bg-gradient-to-br from-yellow-50 to-white"
        />
        <KPICard
          title="Total Gross Value"
          value={kpiLoading ? (
            <LoadingSpinner size="sm" />
          ) : kpiError ? (
            'Error'
          ) : (
            formatCurrency(totalAssetValue)
          )}
          secondaryValue={kpiLoading ? 'Loading...' : kpiError ? kpiError : undefined}
          change={kpiLoading || kpiError ? undefined : 5.8}
          changeLabel={kpiLoading || kpiError ? undefined : "vs last quarter"}
          icon={<DollarSign className="h-full w-full" />}
          color="bg-green-100 text-green-700"
          bgColor="bg-gradient-to-br from-green-50 to-white"
        />
        <KPICard
          title="Net Book Value"
          value={kpiLoading ? (
            <LoadingSpinner size="sm" />
          ) : kpiError ? (
            'Error'
          ) : (
            formatCurrency(netBookValue)
          )}
          secondaryValue={kpiLoading ? 'Loading...' : kpiError ? kpiError : undefined}
          change={kpiLoading || kpiError ? undefined : -2.1}
          changeLabel={kpiLoading || kpiError ? undefined : "depreciation"}
          icon={<TrendingUp className="h-full w-full" />}
          color="bg-green-100 text-green-700"
          bgColor="bg-gradient-to-br from-green-50 to-white"
        />
      </div>

      {/* Drill-down chart: Service → Category → Subcategory (Oracle counts); selection filters Asset Register below */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <AssetDrilldownChart onSelectionChange={handleChartSelectionChange} />
      </div>

      {/* Maintenance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preventive Maintenance Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Preventive Maintenance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Upcoming (7 days)</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingMaintenance7Days}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueMaintenance}</p>
            </div>
          </div>
        </div>

        {/* Idle Assets Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Idle Assets (&gt;30 days)</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Total Idle</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpiLoading ? <LoadingSpinner size="sm" /> : idleOver30Days}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Value at Risk</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(idleValueAtRisk)}</p>
            </div>
          </div>
        </div>

        {/* Utilization Rate Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Utilization Rate</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold text-gray-900">78%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Target</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Register Table (srm_assets single source of truth) with hierarchy filters */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Asset Register</h2>
        </div>
        <div className="overflow-x-auto">
          {register.error ? (
            <ErrorMessage
              message={register.error}
              onRetry={() => {
                void register.refetch();
                void refetchKpis();
              }}
            />
          ) : (
            <>
              {register.loading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-600">Loading register...</span>
                </div>
              )}
              <DataTable<AssetRegisterRow>
                data={register.data}
                columns={registerColumns}
                searchable
                searchPlaceholder="Search asset ID, name, supplier..."
                searchValue={registerSearchInput}
                onSearchChange={setRegisterSearchInput}
                toolbarExtra={
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-gray-600 hidden sm:inline">Filter:</span>
                    <button
                      type="button"
                      onClick={() => handleRegisterFilterChange({ status: undefined })}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                        !register.params.status
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterFilterChange({ status: 'Active' })}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                        register.params.status === 'Active'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Active Asset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegisterFilterChange({ status: 'Idle' })}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                        register.params.status === 'Idle'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Idle Asset
                    </button>
                  </div>
                }
                pagination
                pageSize={register.pageSize}
                totalRowCount={register.totalRows}
                currentPage={register.page}
                onPageChange={register.setPage}
                onSortRequest={(sortBy, sortDir) =>
                  register.setSort(registerSortByMap[sortBy] ?? sortBy, sortDir)
                }
                exportable
                onExport={handleRegisterExport}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
