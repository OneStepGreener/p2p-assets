import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  onSortRequest?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  totalRowCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  onRowSelect?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  exportable?: boolean;
  onExport?: (format: 'csv' | 'excel') => void;
  /** Optional content rendered next to the search box (e.g. status filter chips) */
  toolbarExtra?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  onSortRequest,
  totalRowCount,
  currentPage: controlledPage,
  onPageChange,
  onSearchChange,
  searchValue: controlledSearchValue,
  onRowSelect,
  onRowClick,
  exportable = true,
  onExport,
  toolbarExtra,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [internalPage, setInternalPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const serverSideSort = Boolean(onSortRequest);
  const serverSidePagination = Boolean(onPageChange);
  const serverSideSearch = Boolean(onSearchChange);
  const currentPage = serverSidePagination ? (controlledPage ?? 1) : internalPage;
  const searchTermOrControlled = serverSideSearch && controlledSearchValue !== undefined ? controlledSearchValue : searchTerm;

  const filteredAndSortedData = useMemo(() => {
    if (serverSideSort) return data;
    let result = [...data];
    if (searchTerm && !serverSideSearch) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, searchTerm, sortColumn, sortDirection, columns, serverSideSort, serverSideSearch]);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredAndSortedData;
    if (serverSidePagination) return data;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, data, currentPage, pageSize, pagination, serverSidePagination]);

  const totalRows = totalRowCount ?? filteredAndSortedData.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const handleSort = (columnKey: string) => {
    if (onSortRequest) {
      const nextDir = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
      setSortColumn(columnKey);
      setSortDirection(nextDir);
      onSortRequest(columnKey, nextDir);
      return;
    }
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map((row) => row.id || row.assetId || row.ticketId));
      setSelectedRows(allIds);
      onRowSelect?.(paginatedData);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const id = row.id || row.assetId || row.ticketId;
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
    const selected = data.filter((r) => newSelected.has(r.id || r.assetId || r.ticketId));
    onRowSelect?.(selected);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      const headers = columns.map((col) => col.label).join(',');
      const rows = filteredAndSortedData.map((row) =>
        columns.map((col) => {
          const value = row[col.key];
          return `"${value?.toString().replace(/"/g, '""') || ''}"`;
        }).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="data-table">
      <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 flex-wrap">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {searchable && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTermOrControlled}
              onChange={(e) => {
                const v = e.target.value;
                if (serverSideSearch) onSearchChange?.(v);
                else setSearchTerm(v);
              }}
              className="input-field w-full sm:max-w-xs text-sm md:text-base"
            />
          )}
          {toolbarExtra}
        </div>
        {exportable && (
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary text-sm"
            >
              Export Excel
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {onRowSelect && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onRowSelect ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const id = row.id || row.assetId || row.ticketId;
                return (
                  <tr
                    key={id || index}
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onRowSelect && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(id)}
                          onChange={(e) => handleSelectRow(row, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-900">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]?.toString() || '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (totalPages > 1 || totalRows > 0) && (
        <div className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-sm text-gray-700">
            Showing {totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows)} of {totalRows} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const next = Math.max(1, currentPage - 1);
                if (serverSidePagination) onPageChange?.(next);
                else setInternalPage(next);
              }}
              disabled={currentPage === 1}
              className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => {
                const next = Math.min(totalPages, currentPage + 1);
                if (serverSidePagination) onPageChange?.(next);
                else setInternalPage(next);
              }}
              disabled={currentPage === totalPages}
              className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
