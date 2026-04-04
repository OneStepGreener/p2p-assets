/**
 * Transfer / Allocation form: Asset ID, destination branch, reason, ref no.
 * Submits to SP_TRANSFER_ASSET (snapshot, log transfer, update asset location, status IN-TRANSIT).
 */
import { useCallback, useEffect, useState } from 'react';
import type { AssetRegisterRow } from '../../types';
import { filterService } from '../../services/filterService';
import type { BranchOption, DivisionOption } from '../../services/filterService';

export interface AssetTransferFormProps {
  row: AssetRegisterRow;
  onSubmit: (params: {
    assetId: string;
    destinationBranchCode: string;
    reason: string;
    remarks: string;
    refNo: string;
  }) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function AssetTransferForm({
  row,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error: externalError = null,
}: AssetTransferFormProps) {
  const [divisionCode, setDivisionCode] = useState('');
  const [destinationBranchCode, setDestinationBranchCode] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [refNo, setRefNo] = useState('');
  const [divisions, setDivisions] = useState<DivisionOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const error = externalError ?? submitError;

  useEffect(() => {
    let cancelled = false;
    setLoadingDivisions(true);
    filterService
      .getDivisions()
      .then((data) => {
        if (!cancelled) setDivisions(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingDivisions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!divisionCode) {
      setBranches([]);
      setDestinationBranchCode('');
      return;
    }
    let cancelled = false;
    setLoadingBranches(true);
    setDestinationBranchCode('');
    filterService
      .getBranches(divisionCode)
      .then((data) => {
        if (!cancelled) setBranches(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingBranches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [divisionCode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      if (!destinationBranchCode.trim()) {
        setSubmitError('Please select a destination branch.');
        return;
      }
      if (!reason.trim()) {
        setSubmitError('Reason is required.');
        return;
      }
      if (!refNo.trim()) {
        setSubmitError('Ref no. is required.');
        return;
      }
      try {
        const result = onSubmit({
          assetId: row.assetId,
          destinationBranchCode: destinationBranchCode.trim(),
          reason: reason.trim(),
          remarks: remarks.trim(),
          refNo: refNo.trim(),
        });
        if (result && typeof (result as Promise<void>).then === 'function') {
          await (result as Promise<void>);
        }
      } catch (err: unknown) {
        setSubmitError(err instanceof Error ? err.message : 'Transfer failed');
      }
    },
    [row.assetId, destinationBranchCode, reason, refNo, onSubmit]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-form-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 id="transfer-form-title" className="text-lg font-semibold text-gray-900">
            Transfer / Allocation – {row.assetName || row.assetId}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Asset ID: {row.assetId}</p>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset ID</label>
            <input
              type="text"
              value={row.assetId}
              readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label htmlFor="transfer-division" className="block text-sm font-medium text-gray-700 mb-1">
              Division <span className="text-red-500">*</span>
            </label>
            <select
              id="transfer-division"
              value={divisionCode}
              onChange={(e) => setDivisionCode(e.target.value)}
              required
              disabled={loadingDivisions}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select division</option>
              {divisions.map((d) => (
                <option key={d.divisionCode} value={d.divisionCode}>
                  {d.divisionName || d.divisionCode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-destination-branch" className="block text-sm font-medium text-gray-700 mb-1">
              Destination branch <span className="text-red-500">*</span>
            </label>
            <select
              id="transfer-destination-branch"
              value={destinationBranchCode}
              onChange={(e) => setDestinationBranchCode(e.target.value)}
              required
              disabled={loadingBranches || !divisionCode}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select destination branch</option>
              {branches.map((b) => (
                <option key={b.branchCode} value={b.branchCode}>
                  {b.branchName || b.branchCode} {b.city ? `(${b.city})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="transfer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select reason</option>
              <option value="BRANCH-RELOCATION">Branch relocation</option>
              <option value="PROJECT-DEPLOYMENT">Project deployment</option>
              <option value="REPAIR">Repair</option>
              <option value="RETURN">Return</option>
              <option value="REALLOCATION">Reallocation</option>
              <option value="DISPOSAL-TRANSIT">Disposal transit</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="transfer-remarks" className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              id="transfer-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter additional remarks (optional)"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="transfer-refno" className="block text-sm font-medium text-gray-700 mb-1">
              Ref no. <span className="text-red-500">*</span>
            </label>
            <input
              id="transfer-refno"
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="Reference number"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="border-t border-gray-200 pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !destinationBranchCode || !reason.trim() || !refNo.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Initiate Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
