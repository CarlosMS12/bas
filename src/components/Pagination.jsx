import React from 'react';

export function Pagination({pagination, onPageChange, onPageSizeChange}) {
	const {page, totalPages, hasNext, hasPrev, limit} = pagination;

	const renderPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;
		let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		if (endPage - startPage < maxVisiblePages - 1) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		if (startPage > 1) {
			pages.push(
				<button
					key="1"
					onClick={() => onPageChange(1)}
					className={`page-number ${page === 1 ? 'active' : ''}`}
				>
					1
				</button>
			);

			if (startPage > 2) {
				pages.push(
					<span key="ellipsis1" className="page-ellipsis">
						...
					</span>
				);
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<button
					key={i}
					onClick={() => onPageChange(i)}
					className={`page-number ${page === i ? 'active' : ''}`}
				>
					{i}
				</button>
			);
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push(
					<span key="ellipsis2" className="page-ellipsis">
						...
					</span>
				);
			}

			pages.push(
				<button
					key={totalPages}
					onClick={() => onPageChange(totalPages)}
					className={`page-number ${page === totalPages ? 'active' : ''}`}
				>
					{totalPages}
				</button>
			);
		}

		return pages;
	};

	return (
		<div className="pagination-container">
			{/* Left side: Info */}
			<div className="pagination-info">
				<span>
					Página {page} de {totalPages}
				</span>
			</div>

			{/* Center: Page controls and numbers */}
			<div className="pagination-controls">
				<button
					className="pagination-btn"
					onClick={() => onPageChange(1)}
					disabled={!hasPrev}
					title="Primera página"
				>
					<span className="material-icons">first_page</span>
				</button>

				<button
					className="pagination-btn"
					onClick={() => onPageChange(page - 1)}
					disabled={!hasPrev}
					title="Página anterior"
				>
					<span className="material-icons">chevron_left</span>
				</button>

				<div className="page-numbers">{renderPageNumbers()}</div>

				<button
					className="pagination-btn"
					onClick={() => onPageChange(page + 1)}
					disabled={!hasNext}
					title="Página siguiente"
				>
					<span className="material-icons">chevron_right</span>
				</button>

				<button
					className="pagination-btn"
					onClick={() => onPageChange(totalPages)}
					disabled={!hasNext}
					title="Última página"
				>
					<span className="material-icons">last_page</span>
				</button>
			</div>

			{/* Right side: Page size */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 'var(--spacing-md)',
					fontSize: '14px',
				}}
			>
				<label
					htmlFor="pageSize"
					style={{fontWeight: '500', color: 'var(--text-secondary)'}}
				>
					Resultados:
				</label>
				<select
					id="pageSize"
					className="page-size-select"
					value={limit}
					onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
				>
					<option value="12">12</option>
					<option value="24">24</option>
					<option value="48">48</option>
					<option value="100">100</option>
				</select>
			</div>
		</div>
	);
}
