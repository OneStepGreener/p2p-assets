import type { AssetRegisterRow } from '../types';

interface AssetTableProps {
  rows: AssetRegisterRow[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  loading?: boolean;
}

const COLS: { key: keyof AssetRegisterRow; label: string; sortKey?: string }[] = [
  { key: 'acquisitionDate', label: 'Acquisition Date', sortKey: 'acquisitionDate' },
  { key: 'assetId', label: 'Asset ID', sortKey: 'assetId' },
  { key: 'assetName', label: 'Asset Name', sortKey: 'assetName' },
  { key: 'divisionName', label: 'Division (Department)' },
  { key: 'branchName', label: 'Branch (Location)' },
  { key: 'regionCode', label: 'Region' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'poNo', label: 'PO No' },
  { key: 'invNo', label: 'Invoice No' },
  { key: 'cost', label: 'Cost', sortKey: 'cost' },
  { key: 'totalCost', label: 'Total Cost' },
  { key: 'netBookValue', label: 'Net Book Value' },
];

function formatNum(v: number | undefined): string {
  if (v == null) return '-';
  return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AssetTable({ rows, sortBy, sortDir, onSort, loading }: AssetTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLS.map(({ key, label, sortKey }) => (
              <th
                key={key}
                className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
              >
                {sortKey ? (
                  <button
                    type="button"
                    onClick={() => onSort(sortKey)}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    {label}
                    {sortBy === sortKey && (
                      <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={COLS.length} className="px-3 py-8 text-center text-gray-500">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLS.length} className="px-3 py-8 text-center text-gray-500">
                No assets found
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.assetId + idx} className="hover:bg-gray-50">
                {COLS.map(({ key }) => {
                  const v = row[key];
                  const isNum = key === 'cost' || key === 'totalCost' || key === 'accumDep' || key === 'netBookValue';

                  let display: string;
                  if (isNum && typeof v === 'number') {
                    display = formatNum(v);
                  } else if (v === null || v === undefined) {
                    display = '-';
                  } else if (typeof v === 'object') {
                    // For any object-like fields (e.g. raw blobs), show a placeholder
                    display = '-';
                  } else {
                    display = String(v);
                  }

                  return (
                    <td key={key} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
