import React from 'react';

export function Notification({message, type = 'error', onClose}) {
	React.useEffect(() => {
		const timer = setTimeout(onClose, 5000);
		return () => clearTimeout(timer);
	}, [onClose]);

	return (
		<div
			style={{
				position: 'fixed',
				top: '20px',
				right: '20px',
				background: type === 'success' ? '#4caf50' : '#b00020',
				color: 'white',
				padding: '16px 24px',
				borderRadius: '8px',
				boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
				zIndex: 1001,
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				animation: 'slideIn 0.3s ease-out',
			}}
		>
			<span className="material-icons" style={{fontSize: '20px'}}>
				{type === 'success' ? 'check_circle' : 'error'}
			</span>
			<span>{message}</span>
		</div>
	);
}

export function LoadingSpinner() {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '200px',
				gap: '8px',
			}}
		>
			<div
				style={{
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					backgroundColor: '#1976d2',
					animation: 'bounce 1.4s infinite ease-in-out both',
					animationDelay: '-0.32s',
				}}
			/>
			<div
				style={{
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					backgroundColor: '#1976d2',
					animation: 'bounce 1.4s infinite ease-in-out both',
					animationDelay: '-0.16s',
				}}
			/>
			<div
				style={{
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					backgroundColor: '#1976d2',
					animation: 'bounce 1.4s infinite ease-in-out both',
				}}
			/>
		</div>
	);
}

export function Avatar({initials, size = 'medium'}) {
	const sizeMap = {
		small: '32px',
		medium: '56px',
		large: '80px',
	};

	const fontSizeMap = {
		small: '14px',
		medium: '24px',
		large: '32px',
	};

	return (
		<div
			style={{
				width: sizeMap[size],
				height: sizeMap[size],
				borderRadius: '50%',
				background: '#1976d2',
				color: 'white',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: fontSizeMap[size],
				fontWeight: '700',
				userSelect: 'none',
			}}
		>
			{initials}
		</div>
	);
}
