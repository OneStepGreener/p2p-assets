/**
 * QR Code column cell: 3 vertical dots menu with "Mark as Idle", "Transfer / Allocation", and "View QR".
 */
import { useCallback, useState, useRef, useEffect } from 'react';
import type { AssetRegisterRow } from '../../types';
import { AssetQRCode } from './AssetQRCode';
import { AssetTransferForm } from './AssetTransferForm';

const MAX_WORDS = 50;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export interface TransferParams {
  assetId: string;
  destinationBranchCode: string;
  reason: string;
  remarks: string;
  refNo: string;
}

export interface AssetQRCodeActionsProps {
  row: AssetRegisterRow;
  formatCurrency?: (value: number) => string;
  onMarkIdle?: (assetId: string, reason: string) => void | Promise<void>;
  onMarkActive?: (assetId: string) => void | Promise<void>;
  onTransfer?: (params: TransferParams) => void | Promise<void>;
}

const isIdle = (status: string) => (status || '').toLowerCase() === 'idle';

export function AssetQRCodeActions({
  row,
  formatCurrency,
  onMarkIdle,
  onMarkActive,
  onTransfer,
}: AssetQRCodeActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [idleModalOpen, setIdleModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const wordCount = countWords(reason);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen, closeMenu]);

  const handleMarkIdleClick = useCallback(() => {
    closeMenu();
    setIdleModalOpen(true);
    setReason('');
    setReasonError('');
  }, [closeMenu]);

  const handleViewQRClick = useCallback(() => {
    closeMenu();
    setQrModalOpen(true);
  }, [closeMenu]);

  const handleTransferClick = useCallback(() => {
    closeMenu();
    setTransferError(null);
    setTransferModalOpen(true);
  }, [closeMenu]);

  const handleTransferSubmit = useCallback(
    async (params: TransferParams) => {
      setTransferError(null);
      setTransferSubmitting(true);
      try {
        const result = onTransfer?.(params);
        if (result && typeof (result as Promise<void>).then === 'function') {
          await (result as Promise<void>);
        }
        setTransferModalOpen(false);
      } catch (err: unknown) {
        setTransferError(err instanceof Error ? err.message : 'Transfer failed');
        throw err;
      } finally {
        setTransferSubmitting(false);
      }
    },
    [onTransfer]
  );

  const handleMarkActiveClick = useCallback(async () => {
    closeMenu();
    try {
      const result = onMarkActive?.(row.assetId);
      if (result && typeof (result as Promise<void>).then === 'function') {
        await (result as Promise<void>);
      }
    } catch (err: unknown) {
      console.error('Mark as active failed:', err);
    }
  }, [row.assetId, onMarkActive]);

  const handleIdleSubmit = useCallback(async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError('Reason is required.');
      return;
    }
    const words = countWords(trimmed);
    if (words > MAX_WORDS) {
      setReasonError(`Reason must not exceed ${MAX_WORDS} words (currently ${words}).`);
      return;
    }
    setReasonError('');
    try {
      const result = onMarkIdle?.(row.assetId, trimmed);
      if (result && typeof (result as Promise<void>).then === 'function') {
        await (result as Promise<void>);
      }
      setIdleModalOpen(false);
      setReason('');
    } catch (err: unknown) {
      setReasonError(err instanceof Error ? err.message : 'Failed to mark as idle');
    }
  }, [reason, row.assetId, onMarkIdle]);

  const handleIdleCancel = useCallback(() => {
    setIdleModalOpen(false);
    setReason('');
    setReasonError('');
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="QR code actions"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 py-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-50"
            role="menu"
          >
            {isIdle(row.status) ? (
              <button
                type="button"
                role="menuitem"
                onClick={handleMarkActiveClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Make it Active
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={handleMarkIdleClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mark as Idle
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleTransferClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Transfer / Allocation
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleViewQRClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View QR
            </button>
          </div>
        )}
      </div>

      {/* Transfer / Allocation modal */}
      {transferModalOpen && (
        <AssetTransferForm
          row={row}
          onSubmit={handleTransferSubmit}
          onCancel={() => {
            setTransferModalOpen(false);
            setTransferError(null);
          }}
          isSubmitting={transferSubmitting}
          error={transferError}
        />
      )}

      {/* Mark as Idle modal */}
      {idleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mark-idle-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 id="mark-idle-title" className="text-lg font-semibold text-gray-900">
                Mark as Idle – {row.assetName || row.assetId}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Asset ID: {row.assetId}</p>
            </div>
            <div className="px-4 py-4">
              <label htmlFor="idle-reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="idle-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason (max 50 words)"
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {wordCount} / {MAX_WORDS} words
              </p>
              {reasonError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {reasonError}
                </p>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleIdleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIdleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Mark as Idle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View QR: controlled AssetQRCode modal only */}
      <AssetQRCode
        row={row}
        size={56}
        title={`Asset: ${row.assetId}`}
        formatCurrency={formatCurrency}
        trigger="none"
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </div>
  );
}
