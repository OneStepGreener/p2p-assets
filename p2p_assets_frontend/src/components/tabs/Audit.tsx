import React, { useState, useMemo } from 'react';
import { KPICard } from '../shared/KPICard';
import { DataTable, Column } from '../shared/DataTable';
import { mockAuditRuns, mockAssetScans, mockDiscrepancies } from '../../data/mockData';
import { AuditRun, AssetScan, Discrepancy, FilterState } from '../../types';
import { CheckCircle, AlertCircle, Timer, Smartphone, Circle } from '../icons';

export const Audit: React.FC<{ filters: FilterState; onFilterChange: (filters: Partial<FilterState>) => void }> = ({
  filters,
}) => {
  const [selectedAuditRun, setSelectedAuditRun] = useState<AuditRun | null>(null);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);

  const filteredAuditRuns = useMemo(() => {
    return mockAuditRuns.filter((run) => {
      if (filters.location !== 'All' && run.location !== filters.location) return false;
      if (filters.department !== 'All' && run.department !== filters.department) return false;
      if (filters.auditor && filters.auditor !== 'All' && run.assignedAuditor !== filters.auditor) return false;
      return true;
    });
  }, [filters]);

  const filteredDiscrepancies = useMemo(() => {
    return mockDiscrepancies.filter((disc) => {
      if (filters.location !== 'All' && disc.location !== filters.location) return false;
      if (filters.department !== 'All' && disc.department !== filters.department) return false;
      if (filters.discrepancySeverity && filters.discrepancySeverity !== 'All' && disc.severity !== filters.discrepancySeverity) return false;
      if (filters.discrepancyStatus && filters.discrepancyStatus !== 'All' && disc.status !== filters.discrepancyStatus) return false;
      return true;
    });
  }, [filters]);

  // Calculate KPIs
  const currentPeriod = filteredAuditRuns.find((r) => r.status === 'In Progress') || filteredAuditRuns[0];
  const auditCompletion = currentPeriod ? currentPeriod.completionPercent : 0;
  const assetsScanned = currentPeriod ? currentPeriod.assetsScanned : 0;
  const assetsPlanned = currentPeriod ? currentPeriod.assetsPlanned : 0;
  const discrepancyRate = assetsScanned > 0 ? ((filteredDiscrepancies.length / assetsScanned) * 100).toFixed(1) : '0';
  const highValueDiscrepancies = filteredDiscrepancies.filter((d) => d.severity === 'High').length;
  const avgResolutionTime = '2.5 days'; // Mock data

  const auditRunColumns: Column<AuditRun>[] = [
    { key: 'id', label: 'Audit ID', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'assignedAuditor', label: 'Assigned Auditor', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          Scheduled: 'bg-gray-100 text-gray-800',
          'In Progress': 'bg-blue-100 text-blue-800',
          Completed: 'bg-green-100 text-green-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || ''}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'completionPercent',
      label: 'Completion %',
      sortable: true,
      render: (value) => `${value}%`,
    },
  ];

  const assetScanColumns: Column<AssetScan>[] = [
    { key: 'assetId', label: 'Asset ID', sortable: true },
    { key: 'assetDescription', label: 'Asset Description', sortable: true },
    { key: 'expectedLocation', label: 'Expected Location', sortable: true },
    { key: 'scannedLocation', label: 'Scanned Location', sortable: true },
    {
      key: 'condition',
      label: 'Condition',
      sortable: true,
      render: (value) => {
        const conditionColors: Record<string, string> = {
          Good: 'bg-green-100 text-green-800',
          'Minor Damage': 'bg-yellow-100 text-yellow-800',
          'Major Damage': 'bg-orange-100 text-orange-800',
          'Non-Functional': 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColors[value] || ''}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'found',
      label: 'Found?',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'discrepancyFlag',
      label: 'Discrepancy',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    { key: 'lastScanTimestamp', label: 'Last Scan', sortable: true },
  ];

  const discrepancyColumns: Column<Discrepancy>[] = [
    { key: 'ticketId', label: 'Ticket ID', sortable: true },
    { key: 'assetId', label: 'Asset ID', sortable: true },
    { key: 'assetDescription', label: 'Asset Description', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value) => {
        const severityColors: Record<string, string> = {
          High: 'bg-red-100 text-red-800',
          Medium: 'bg-yellow-100 text-yellow-800',
          Low: 'bg-green-100 text-green-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[value] || ''}`}>
            {value}
          </span>
        );
      },
    },
    { key: 'discrepancyType', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          'Awaiting Investigation': 'bg-gray-100 text-gray-800',
          'In Investigation': 'bg-blue-100 text-blue-800',
          'Pending Approval': 'bg-yellow-100 text-yellow-800',
          Resolved: 'bg-green-100 text-green-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || ''}`}>
            {value}
          </span>
        );
      },
    },
    { key: 'owner', label: 'Owner', sortable: true },
  ];

  const handleDiscrepancyUpdate = (outcome: string, comments: string) => {
    // Handle discrepancy update
    console.log('Updating discrepancy:', { outcome, comments });
    setShowDiscrepancyModal(false);
    setSelectedDiscrepancy(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <KPICard
          title="Audit Completion %"
          value={`${auditCompletion}%`}
          secondaryValue={`${assetsScanned} of ${assetsPlanned} assets`}
          change={5.2}
          icon={<CheckCircle className="h-full w-full" />}
          color="bg-green-100 text-green-600"
        />
        <KPICard
          title="Assets Scanned"
          value={assetsScanned}
          secondaryValue={`of ${assetsPlanned} planned`}
          change={3.1}
          icon={<Smartphone className="h-full w-full" />}
          color="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Discrepancy Rate"
          value={`${discrepancyRate}%`}
          secondaryValue={`${filteredDiscrepancies.length} discrepancies`}
          change={-1.5}
          icon={<AlertCircle className="h-full w-full" />}
          color="bg-yellow-100 text-yellow-600"
        />
        <KPICard
          title="High-Value Discrepancies"
          value={highValueDiscrepancies}
          secondaryValue="Requires immediate attention"
          icon={<Circle className="h-full w-full" />}
          color="bg-red-100 text-red-600"
        />
        <KPICard
          title="Avg Resolution Time"
          value={avgResolutionTime}
          secondaryValue="Time to resolve discrepancies"
          change={-0.5}
          icon={<Timer className="h-full w-full" />}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Audit Schedule Panel */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Audit Schedule</h2>
        <div className="overflow-x-auto">
          <DataTable
          data={filteredAuditRuns}
          columns={auditRunColumns}
          onRowClick={(row) => setSelectedAuditRun(row as AuditRun)}
          exportable={true}
        />
        </div>
      </div>

      {/* Audit Details & Asset Scan Table */}
      {selectedAuditRun && (
        <div className="space-y-3 md:space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Audit Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Assets Planned</p>
                <p className="text-xl md:text-2xl font-bold">{selectedAuditRun.assetsPlanned}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assets Scanned</p>
                <p className="text-xl md:text-2xl font-bold">{selectedAuditRun.assetsScanned}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discrepancies</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{selectedAuditRun.discrepancies}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{selectedAuditRun.completionPercent}%</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Asset Scan Results</h3>
            <div className="overflow-x-auto">
              <DataTable
              data={mockAssetScans}
              columns={assetScanColumns}
              exportable={true}
            />
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Queue */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Discrepancy Queue</h2>
        <div className="overflow-x-auto">
          <DataTable
          data={filteredDiscrepancies}
          columns={discrepancyColumns}
          onRowClick={(row) => {
            setSelectedDiscrepancy(row as Discrepancy);
            setShowDiscrepancyModal(true);
          }}
          exportable={true}
        />
        </div>
      </div>

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && selectedDiscrepancy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-xl md:text-2xl font-bold">Discrepancy Details</h3>
                <button
                  onClick={() => {
                    setShowDiscrepancyModal(false);
                    setSelectedDiscrepancy(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Ticket ID</p>
                  <p className="font-semibold">{selectedDiscrepancy.ticketId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asset</p>
                  <p className="font-semibold">{selectedDiscrepancy.assetDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <p className="font-semibold">{selectedDiscrepancy.severity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold">{selectedDiscrepancy.discrepancyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{selectedDiscrepancy.status}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome
                  </label>
                  <select
                    className="input-field"
                    value={selectedDiscrepancy.outcome || ''}
                    onChange={(e) => {
                      setSelectedDiscrepancy({
                        ...selectedDiscrepancy,
                        outcome: e.target.value as any,
                      });
                    }}
                  >
                    <option value="">Select outcome...</option>
                    <option value="Found Relocated">Found Relocated</option>
                    <option value="Lost or Stolen">Lost or Stolen</option>
                    <option value="Documentation Error">Documentation Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={selectedDiscrepancy.comments || ''}
                    onChange={(e) => {
                      setSelectedDiscrepancy({
                        ...selectedDiscrepancy,
                        comments: e.target.value,
                      });
                    }}
                    placeholder="Add comments..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <button
                    onClick={() => handleDiscrepancyUpdate(selectedDiscrepancy.outcome || '', selectedDiscrepancy.comments || '')}
                    className="btn-primary w-full sm:w-auto sm:flex-1"
                  >
                    Update Discrepancy
                  </button>
                  <button
                    onClick={() => {
                      setShowDiscrepancyModal(false);
                      setSelectedDiscrepancy(null);
                    }}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
