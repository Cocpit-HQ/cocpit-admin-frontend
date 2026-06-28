import React from 'react';
import Spinner from './Spinner';

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No data available.',
  onRowClick,
  pagination, // e.g. { currentPage, totalPages, onPageChange }
}) => {
  return (
    <div className="flex flex-col w-full bg-surface border border-outline/10 rounded-2xl shadow-xs overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-variant/40 border-b border-outline/10">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-title ${col.className || ''}`}
                  style={col.style}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading State Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-outline/5 last:border-0">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                      <div className="h-4 bg-outline/10 rounded-sm animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State Row
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="h-10 w-10 text-on-surface-variant/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 0h-4M4 13h4" />
                    </svg>
                    <span className="text-sm font-medium text-on-surface-variant">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              // Active Data Rows
              data.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-outline/5 last:border-0 hover:bg-outline/5 transition duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, cIdx) => {
                    const value = row[col.accessor];
                    return (
                      <td key={cIdx} className={`px-6 py-4 text-sm text-on-surface font-body-md ${col.cellClassName || ''}`}>
                        {col.cell ? col.cell(row) : value !== undefined && value !== null ? String(value) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-outline/10 px-6 py-4 bg-surface-variant/10">
          <span className="text-xs text-on-surface-variant">
            Page <span className="font-semibold">{pagination.currentPage}</span> of{' '}
            <span className="font-semibold">{pagination.totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || isLoading}
              className="cursor-pointer px-3 py-1.5 rounded-lg border border-outline text-xs font-semibold hover:bg-outline/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
              className="cursor-pointer px-3 py-1.5 rounded-lg border border-outline text-xs font-semibold hover:bg-outline/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
