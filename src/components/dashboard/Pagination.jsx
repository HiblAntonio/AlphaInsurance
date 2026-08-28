import React from "react";

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, 3];
  }

  if (currentPage >= totalPages - 1) {
    return [totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 1, currentPage, currentPage + 1];
}

export default function Pagination({ pageNumber, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const visiblePages = getVisiblePages(pageNumber, totalPages);

  return (
    <div className="pagination-row">
      <button
        type="button"
        className="page-arrow"
        aria-label="Prethodna stranica"
        onClick={() => onPageChange(pageNumber - 1)}
        disabled={pageNumber === 1}
      >
        <img src="/svg/arrow-left.svg" alt="Prethodna" />
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          className={`page-number ${page === pageNumber ? "active" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="page-arrow"
        aria-label="Sljedeća stranica"
        onClick={() => onPageChange(pageNumber + 1)}
        disabled={pageNumber === totalPages}
      >
        <img src="/svg/arrow-right.svg" alt="Sljedeća" />
      </button>
    </div>
  );
}