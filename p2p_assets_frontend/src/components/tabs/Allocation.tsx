import React, { useState, useCallback } from 'react';
import { KPICard } from '../shared/KPICard';
import { DataTable, Column } from '../shared/DataTable';
import { AssetTransfer, FilterState } from '../../types';
import { Building, DollarSign, User, Pause } from '../icons';
import { useAssetTransfers } from '../../hooks/useAssetTransfers';
import { allocationService } from '../../services/allocationService';

export const Allocation: React.FC<{ filters: FilterState; onFilterChange: (filters: Partial<FilterState>) => void }> = ({
  filters,
}) => {
  const [selectedTransfer, setSelectedTransfer] = useState<AssetTransfer | null>(null);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [assetMovements, setAssetMovements] = useState<AssetTransfer[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const transfers = useAssetTransfers({
    status: filters.status !== 'All' ? filters.status : undefined,
  });

  const pendingCount = transfers.data.filter((t) => t.transferStatus === 'Pending').length;
  const completedCount = transfers.data.filter((t) => t.transferStatus === 'Completed').length;
  const inProgressCount = transfers.data.filter((t) => t.transferStatus === 'In Progress').length;

  const transferColumns: Column<AssetTransfer>[] = [
    { key: 'transferId', label: 'Transfer ID', sortable: true },
    { key: 'assetTagId', label: 'Asset ID', sortable: true },
    { key: 'fromLocation', label: 'From Location', sortable: true },
    { key: 'toLocation', label: 'To Location', sortable: true },
    { key: 'fromDepartment', label: 'From Dept', sortable: true },
    { key: 'toDepartment', label: 'To Dept', sortable: true },
    { key: 'transferDate', label: 'Transfer Date', sortable: true },
    {
      key: 'transferStatus',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          Pending: 'bg-yellow-100 text-yellow-800',
          'In Progress': 'bg-blue-100 text-blue-800',
          Completed: 'bg-green-100 text-green-800',
          Cancelled: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
    { key: 'approvedBy', label: 'Approved By', sortable: true },
  ];

  const handleTransferClick = useCallback(async (transfer: AssetTransfer) => {
    setSelectedTransfer(transfer);
    setShowMovementHistory(true);
    setMovementsLoading(true);
    try {
      const movements = await allocationService.getAssetMovements(transfer.assetTagId);
      setAssetMovements(movements);
    } catch (err) {
      console.error('Failed to fetch movements:', err);
      setAssetMovements([]);
    } finally {
      setMovementsLoading(false);
    }
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selectedTransfer) return;
    setApproveError(null);
    setApproving(true);
    try {
      const updated = await allocationService.approveTransfer(selectedTransfer.transferId);
      // Update selected transfer and list
      setSelectedTransfer(updated);
      transfers.refetch();
    } catch (err: any) {
      setApproveError(err.message || 'Failed to approve transfer');
    } finally {
      setApproving(false);
    }
  }, [selectedTransfer, transfers]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Transfers"
          value={transfers.totalRows}
          secondaryValue="All transfers"
          icon={<Building className="h-full w-full" />}
          color="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Completed"
          value={completedCount}
          secondaryValue="Completed transfers"
          icon={<DollarSign className="h-full w-full" />}
          color="bg-green-100 text-green-600"
        />
        <KPICard
          title="Pending"
          value={pendingCount}
          secondaryValue="Awaiting approval"
          icon={<Pause className="h-full w-full" />}
          color="bg-yellow-100 text-yellow-600"
        />
        <KPICard
          title="In Progress"
          value={inProgressCount}
          secondaryValue="Currently in progress"
          icon={<User className="h-full w-full" />}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Asset Transfers Table */}
      <div>
        <div className="mb-3 md:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Asset Transfers</h2>
        </div>
        <div className="overflow-x-auto">
          {transfers.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading transfers...</span>
            </div>
          ) : transfers.error ? (
            <div className="text-center py-8 text-red-600">{transfers.error}</div>
          ) : (
            <DataTable
              data={transfers.data}
              columns={transferColumns}
              onRowClick={handleTransferClick}
              exportable={true}
            />
          )}
        </div>
      </div>

      {/* Asset Movement History Side Panel */}
      {showMovementHistory && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center md:justify-end z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-bold">Asset Movement History</h3>
                <button
                  onClick={() => {
                    setShowMovementHistory(false);
                    setSelectedTransfer(null);
                    setAssetMovements([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl md:text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm md:text-base">Transfer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Transfer ID</p>
                    <p className="font-semibold">{selectedTransfer.transferId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Asset ID</p>
                    <p className="font-semibold">{selectedTransfer.assetTagId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">From Location</p>
                    <p className="font-semibold">{selectedTransfer.fromLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">To Location</p>
                    <p className="font-semibold">{selectedTransfer.toLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-semibold">{selectedTransfer.transferStatus}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transfer Date</p>
                    <p className="font-semibold">{selectedTransfer.transferDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Approved By</p>
                    <p className="font-semibold">
                      {selectedTransfer.approvedBy && selectedTransfer.approvedBy !== '-'
                        ? selectedTransfer.approvedBy
                        : 'Pending'}
                    </p>
                  </div>
                </div>
                {approveError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {approveError}
                  </p>
                )}
                {(!selectedTransfer.approvedBy || selectedTransfer.approvedBy === '-') && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {approving ? 'Approving...' : 'Approve Transfer'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Movement Timeline</h4>
                {movementsLoading ? (
                  <div className="flex items-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-gray-600 text-sm">Loading movements...</span>
                  </div>
                ) : assetMovements.length === 0 ? (
                  <p className="text-gray-500 text-sm">No movement history available</p>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {assetMovements.map((movement) => (
                      <div key={movement.transferId} className="border-l-4 border-primary-500 pl-3 md:pl-4 pb-3 md:pb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm md:text-base">{movement.transferDate}</p>
                            <p className="text-xs md:text-sm text-gray-600">
                              From: {movement.fromLocation} ({movement.fromDepartment})
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              To: {movement.toLocation} ({movement.toDepartment})
                            </p>
                            {movement.transferReason && movement.transferReason !== '-' && (
                              <p className="text-xs md:text-sm text-gray-500 mt-1">Reason: {movement.transferReason}</p>
                            )}
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs md:text-sm text-gray-600">Approved by</p>
                            <p className="text-xs md:text-sm font-semibold">{movement.approvedBy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <button className="btn-primary w-full sm:w-auto sm:flex-1">Transfer / Reassign Asset</button>
                <button className="btn-secondary w-full sm:w-auto">Mark Idle</button>
                <button className="btn-secondary w-full sm:w-auto">Start Audit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
