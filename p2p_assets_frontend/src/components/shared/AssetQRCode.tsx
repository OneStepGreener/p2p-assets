/**
 * Renders a small QR in the table. Click opens one modal card with a small high-quality QR and full asset details.
 * Download uses a hidden 512px canvas for sharper PNG.
 */
import { useCallback, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { AssetRegisterRow } from '../../types';

export interface AssetQRCodeProps {
  row: AssetRegisterRow;
  size?: number;
  title?: string;
  /** Optional currency formatter for Cost / Net Book Value in the modal */
  formatCurrency?: (value: number) => string;
  /** When 'none', only the modal is rendered (no trigger button). Use with open/onOpenChange for external control. */
  trigger?: 'button' | 'none';
  /** Controlled open state for the modal (use with trigger="none" to open from menu). */
  open?: boolean;
  /** Called when modal open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/** Build a clean payload for QR so scanners get all key details (no raw blob). */
function assetPayload(row: AssetRegisterRow): string {
  const payload: Record<string, string | number | undefined> = {
    'Asset ID': row.assetId,
    Name: row.assetName,
    Division: row.divisionName,
    Branch: row.branchName,
    City: row.city,
    State: row.state,
    Country: row.country,
    Region: row.regionCode,
    Category: row.categoryName,
    Subcategory: row.subcategoryName,
    Location: row.locationName,
    Department: row.departmentName,
    Status: row.status,
    Vendor: row.vendor,
    'Acquisition Date': row.acquisitionDate,
    'Put to Use': row.putToUseDate,
    'PO No': row.poNo,
    'Invoice No': row.invNo,
    Cost: row.cost,
    'Total Cost': row.totalCost,
    'Net Book Value': row.netBookValue,
    'Warranty Expiry': row.warrantyExpiry,
    'AMC Expiry': row.amcExpiry,
  };
  if (row.serviceDesc) (payload as Record<string, unknown>)['Service'] = row.serviceDesc;
  return JSON.stringify(payload, null, 0);
}

/** Small QR in modal (high quality level H); download uses 512px for sharper PNG */
const MODAL_QR_SIZE = 160;
const DOWNLOAD_QR_SIZE = 512;

const defaultFormatCurrency = (value: number): string =>
  value >= 1000 ? `₹${(value / 1000).toFixed(2)}K` : `₹${value.toLocaleString('en-IN')}`;

export function AssetQRCode({
  row,
  size = 64,
  title,
  formatCurrency = defaultFormatCurrency,
  trigger = 'button',
  open: controlledOpen,
  onOpenChange,
}: AssetQRCodeProps) {
  const value = useMemo(() => assetPayload(row), [row]);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) onOpenChange?.(next);
      else setInternalOpen(next);
    },
    [isControlled, onOpenChange]
  );
  const qrId = `asset-qr-thumb-${row.assetId}`;
  const modalQrId = `asset-qr-modal-${row.assetId}`;
  const downloadQrId = `asset-qr-download-${row.assetId}`;

  const handleOpenModal = useCallback(() => setOpen(true), [setOpen]);
  const handleCloseModal = useCallback(() => setOpen(false), [setOpen]);

  const handleDownload = useCallback(() => {
    const canvas = document.getElementById(downloadQrId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `asset-qr-${row.assetId}-${(row.assetName || 'asset').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 30)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [downloadQrId, row.assetId, row.assetName]);

  return (
    <>
      {trigger === 'button' && (
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex flex-col items-center gap-0.5 cursor-pointer border-0 bg-transparent p-0 align-middle hover:opacity-90 focus:opacity-90 focus:outline-none"
          title={`View QR (${row.assetId}) – contains all asset details`}
        >
          <QRCodeCanvas
            id={qrId}
            value={value}
            size={size}
            level="M"
            title={title ?? `QR: ${row.assetId} - ${row.assetName}`}
            bgColor="#ffffff"
            fgColor="#000000"
          />
          <span className="text-[10px] text-gray-500 whitespace-nowrap">View QR</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 shrink-0">
              <h2 id="qr-modal-title" className="text-lg font-semibold text-gray-900">
                Asset: {row.assetName || row.assetId}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center shrink-0">
                  <p className="text-sm text-gray-500 mb-2">Scan for full asset details</p>
                  <div className="relative bg-gray-50 p-3 rounded-lg inline-block">
                    <QRCodeCanvas
                      id={modalQrId}
                      value={value}
                      size={MODAL_QR_SIZE}
                      level="H"
                      title={`QR: ${row.assetId} - ${row.assetName}`}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                    <div
                      className="absolute overflow-hidden"
                      style={{ left: -DOWNLOAD_QR_SIZE - 100, top: 0, width: DOWNLOAD_QR_SIZE, height: DOWNLOAD_QR_SIZE }}
                      aria-hidden="true"
                    >
                      <QRCodeCanvas
                        id={downloadQrId}
                        value={value}
                        size={DOWNLOAD_QR_SIZE}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="mt-3 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Download QR
                  </button>
                </div>
                <dl className="space-y-2 text-sm min-w-0 flex-1">
                  <div>
                    <dt className="font-medium text-gray-500">Asset ID</dt>
                    <dd className="text-gray-900">{row.assetId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Division / Branch</dt>
                    <dd className="text-gray-900">{row.divisionName ?? '-'} / {row.branchName ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">City / State / Country</dt>
                    <dd className="text-gray-900">{row.city ?? '-'} / {row.state ?? '-'} / {row.country ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Category / Subcategory</dt>
                    <dd className="text-gray-900">{row.categoryName ?? '-'} / {row.subcategoryName ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Location / Department</dt>
                    <dd className="text-gray-900">{row.locationName ?? '-'} / {row.departmentName ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Status</dt>
                    <dd className="text-gray-900">{row.status}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Cost / Net Book Value</dt>
                    <dd className="text-gray-900">{formatCurrency(row.cost ?? 0)} / {formatCurrency(row.netBookValue ?? 0)}</dd>
                  </div>
                </dl>
              </div>
              {row.raw && Object.keys(row.raw).length > 0 && (
                <>
                  <h4 className="mt-4 mb-2 font-medium text-gray-700">Additional fields (srm_assets)</h4>
                  <dl className="space-y-1 text-xs">
                    {Object.entries(row.raw).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-gray-100 py-1">
                        <dt className="text-gray-500 break-all">{k}</dt>
                        <dd className="text-gray-900 text-right break-all">{String(v ?? '-')}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
