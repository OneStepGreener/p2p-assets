import React, { useState, useEffect, useCallback } from 'react';
import { getAssets, downloadExport } from '../api/assets';
import { AssetTable } from '../components/AssetTable';
import type { AssetRegisterRow } from '../types';

type SortKey = 'assetId' | 'assetName' | 'acquisitionDate' | 'cost' | 'status';

export function AssetRegister() {
  const [data, setData] = useState<AssetRegisterRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('acquisitionDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAssets({
        search: search || undefined,
        page,
        pageSize,
        sortBy,
        sortDir,
      });
      setData(res.data);
      setTotalRows(res.totalRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, sortBy, sortDir]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSort = (col: string) => {
    const key = col as SortKey;
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      await downloadExport(format, { search: search || undefined, sortBy, sortDir });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Export ${format} failed`);
    } finally {
      setExporting(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  return (
    <div className="p-4 max-w-full">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search asset ID, name, PO, invoice, vendor…"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-70"
          >
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            disabled={!!exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
          >
            {exporting === 'xlsx' ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <AssetTable
        rows={data}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        loading={loading}
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {page} of {totalPages} ({totalRows} total)
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
