import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import "./Pagination.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) {
    return null;
  }

  // Calculate start and end indices for display
  const startItem = totalItems
    ? Math.min((currentPage - 1) * (itemsPerPage || 1) + 1, totalItems)
    : 1;
  const endItem = totalItems
    ? Math.min(currentPage * (itemsPerPage || 1), totalItems)
    : 0;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="pagination-wrapper" aria-label="Kelionių puslapiai">
      {totalItems !== undefined && (
        <div className="pagination-info">
          Rodoma <strong>{startItem}–{endItem}</strong> iš <strong>{totalItems}</strong> kelionių
        </div>
      )}

      <ul className="pagination-controls">
        <li>
          <button
            type="button"
            className="pagination-btn pagination-nav-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Ankstesnis puslapis"
          >
            <IoChevronBack aria-hidden="true" />
            <span className="pagination-nav-text">Atgal</span>
          </button>
        </li>

        {pages.map((p, idx) => (
          <li key={idx}>
            {typeof p === "number" ? (
              <button
                type="button"
                className={`pagination-btn ${p === currentPage ? "active" : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={p === currentPage ? "page" : undefined}
                aria-label={`Puslapis ${p}`}
              >
                {p}
              </button>
            ) : (
              <span className="pagination-ellipsis">&hellip;</span>
            )}
          </li>
        ))}

        <li>
          <button
            type="button"
            className="pagination-btn pagination-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Kitas puslapis"
          >
            <span className="pagination-nav-text">Kitas</span>
            <IoChevronForward aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
