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
					style={{
						padding: '8px 12px',
						margin: '0 2px',
						background: 'white',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '14px',
					}}
				>
					1
				</button>
			);

			if (startPage > 2) {
				pages.push(
					<span key="ellipsis1" style={{padding: '0 8px', alignSelf: 'center'}}>
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
					style={{
						padding: '8px 12px',
						margin: '0 2px',
						background: page === i ? '#1976d2' : 'white',
						color: page === i ? 'white' : '#212121',
						border: page === i ? 'none' : '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '14px',
						fontWeight: page === i ? '600' : '400',
					}}
				>
					{i}
				</button>
			);
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push(
					<span key="ellipsis2" style={{padding: '0 8px', alignSelf: 'center'}}>
						...
					</span>
				);
			}

			pages.push(
				<button
					key={totalPages}
					onClick={() => onPageChange(totalPages)}
					style={{
						padding: '8px 12px',
						margin: '0 2px',
						background: 'white',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '14px',
					}}
				>
					{totalPages}
				</button>
			);
		}

		return pages;
	};

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: '16px',
				background: 'white',
				borderRadius: '8px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
				flexWrap: 'wrap',
				gap: '16px',
			}}
		>
			{/* Left side: Info */}
			<div style={{fontSize: '14px', color: '#757575'}}>
				Página {page} de {totalPages}
			</div>

			{/* Center: Page numbers */}
			<div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
				<button
					onClick={() => onPageChange(1)}
					disabled={!hasPrev}
					style={{
						padding: '8px 12px',
						background: hasPrev ? 'white' : '#f5f5f5',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: hasPrev ? 'pointer' : 'not-allowed',
						color: hasPrev ? '#212121' : '#9e9e9e',
					}}
				>
					<span className="material-icons" style={{fontSize: '16px'}}>
						first_page
					</span>
				</button>

				<button
					onClick={() => onPageChange(page - 1)}
					disabled={!hasPrev}
					style={{
						padding: '8px 12px',
						background: hasPrev ? 'white' : '#f5f5f5',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: hasPrev ? 'pointer' : 'not-allowed',
						color: hasPrev ? '#212121' : '#9e9e9e',
					}}
				>
					<span className="material-icons" style={{fontSize: '16px'}}>
						chevron_left
					</span>
				</button>

				<div style={{display: 'flex', gap: '4px', margin: '0 8px'}}>
					{renderPageNumbers()}
				</div>

				<button
					onClick={() => onPageChange(page + 1)}
					disabled={!hasNext}
					style={{
						padding: '8px 12px',
						background: hasNext ? 'white' : '#f5f5f5',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: hasNext ? 'pointer' : 'not-allowed',
						color: hasNext ? '#212121' : '#9e9e9e',
					}}
				>
					<span className="material-icons" style={{fontSize: '16px'}}>
						chevron_right
					</span>
				</button>

				<button
					onClick={() => onPageChange(totalPages)}
					disabled={!hasNext}
					style={{
						padding: '8px 12px',
						background: hasNext ? 'white' : '#f5f5f5',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						cursor: hasNext ? 'pointer' : 'not-allowed',
						color: hasNext ? '#212121' : '#9e9e9e',
					}}
				>
					<span className="material-icons" style={{fontSize: '16px'}}>
						last_page
					</span>
				</button>
			</div>

			{/* Right side: Page size */}
			<div
				style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'}}
			>
				<label htmlFor="pageSize">Resultados por página:</label>
				<select
					id="pageSize"
					value={limit}
					onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
					style={{
						padding: '6px 8px',
						border: '1px solid #e0e0e0',
						borderRadius: '4px',
						fontSize: '14px',
						fontFamily: 'inherit',
						cursor: 'pointer',
						outline: 'none',
					}}
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
