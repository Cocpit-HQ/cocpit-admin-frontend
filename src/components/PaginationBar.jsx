import React from 'react';

export default function PaginationBar({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-surface-variant pt-4 mt-6">
      <div className="text-body-sm text-on-surface-variant">
        Showing page <span className="font-medium text-on-surface">{currentPage}</span> of <span className="font-medium text-on-surface">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-label-md font-medium rounded-full bg-surface-container text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-variant transition-colors"
        >
          Previous
        </button>
        <div className="flex space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-full text-label-md font-medium transition-colors ${
                currentPage === page
                  ? 'bg-primary text-on-primary'
                  : 'bg-transparent text-on-surface hover:bg-surface-variant'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-label-md font-medium rounded-full bg-surface-container text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-variant transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
