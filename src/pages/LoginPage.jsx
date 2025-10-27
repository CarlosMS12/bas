import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {Notification} from '../components/Common';

export function LoginPage() {
	const navigate = useNavigate();
	const {login, isLoading} = useAuth();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const [notification, setNotification] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleInputChange = (e) => {
		const {name, value} = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const result = await login(formData.email, formData.password);

			if (result.success) {
				setNotification(null);
				navigate('/app');
			} else {
				setNotification({
					message: result.error,
					type: 'error',
				});
			}
		} catch (error) {
			setNotification({
				message: 'Error al iniciar sesión',
				type: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
				backgroundAttachment: 'fixed',
				padding: '20px',
				fontFamily:
					"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
			}}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
					overflow: 'hidden',
					animation: 'slideUp 0.4s ease-out',
					transition: 'all 0.3s ease',
					border: '1px solid rgba(255, 255, 255, 0.8)',
					width: '100%',
					maxWidth: '400px',
				}}
			>
				{/* Notification - Above header */}
				{notification && (
					<div
						style={{
							padding: '12px 20px',
							borderRadius: '0',
							fontSize: '13px',
							animation: 'slideDown 0.3s ease',
							borderLeft: '3px solid #b00020',
							background: '#fef2f2',
							border: '1px solid #fecaca',
							borderRadius: '12px 12px 0 0',
							color: '#b00020',
							fontWeight: '500',
						}}
					>
						{notification.message}
					</div>
				)}

				{/* Header */}
				<div
					style={{
						padding: '35px 20px',
						textAlign: 'center',
						position: 'relative',
					}}
				>
					<div
						style={{
							width: '120px',
							height: '120px',
							margin: '0 auto 15px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							overflow: 'hidden',
						}}
					>
						<img
							src="/assets/logo.jpg"
							alt="Logo Escuela"
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
							onError={(e) => {
								e.target.style.display = 'none';
							}}
						/>
					</div>
					<h1
						style={{
							fontSize: '22px',
							fontWeight: '700',
							color: '#000000',
							marginBottom: '6px',
							letterSpacing: '-0.3px',
						}}
					>
						Sistema de Estudiantes
					</h1>
					<p
						style={{
							fontSize: '13px',
							color: 'rgba(0, 0, 0, 0.85)',
							margin: 0,
							letterSpacing: '0.2px',
						}}
					>
						Acceso seguro
					</p>
				</div>

				{/* Body */}
				<div style={{padding: '30px'}}>
					<form
						onSubmit={handleSubmit}
						style={{display: 'flex', flexDirection: 'column', gap: '18px'}}
					>
						<div style={{display: 'flex', flexDirection: 'column'}}>
							<label
								htmlFor="email"
								style={{
									display: 'block',
									fontSize: '13px',
									fontWeight: '500',
									color: '#555',
									marginBottom: '6px',
								}}
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								required
								placeholder="tu@email.com"
								style={{
									width: '100%',
									padding: '10px 12px',
									fontSize: '14px',
									border: '1px solid #e0e0e0',
									borderRadius: '6px',
									fontFamily: "'Inter', sans-serif",
									transition: 'all 0.3s ease',
									background: '#fafbfc',
									outline: 'none',
								}}
								onFocus={(e) => {
									e.target.style.borderColor = '#1976d2';
									e.target.style.background = 'white';
									e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.15)';
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#e0e0e0';
									e.target.style.background = '#fafbfc';
									e.target.style.boxShadow = 'none';
								}}
							/>
						</div>

						<div style={{display: 'flex', flexDirection: 'column'}}>
							<label
								htmlFor="password"
								style={{
									display: 'block',
									fontSize: '13px',
									fontWeight: '500',
									color: '#555',
									marginBottom: '6px',
								}}
							>
								Contraseña
							</label>
							<input
								id="password"
								type="password"
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								required
								placeholder="••••••••"
								style={{
									width: '100%',
									padding: '10px 12px',
									fontSize: '14px',
									border: '1px solid #e0e0e0',
									borderRadius: '6px',
									fontFamily: "'Inter', sans-serif",
									transition: 'all 0.3s ease',
									background: '#fafbfc',
									outline: 'none',
								}}
								onFocus={(e) => {
									e.target.style.borderColor = '#1976d2';
									e.target.style.background = 'white';
									e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.15)';
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#e0e0e0';
									e.target.style.background = '#fafbfc';
									e.target.style.boxShadow = 'none';
								}}
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || isLoading}
							style={{
								width: '100%',
								padding: '10px',
								background:
									isSubmitting || isLoading
										? '#90caf9'
										: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
								transition: 'all 0.3s ease',
								fontFamily: "'Inter', sans-serif",
								position: 'relative',
								overflow: 'hidden',
								boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
							}}
							onMouseEnter={(e) => {
								if (!isSubmitting && !isLoading) {
									e.target.style.transform = 'translateY(-2px)';
									e.target.style.boxShadow = '0 6px 16px rgba(25, 118, 210, 0.4)';
								}
							}}
							onMouseLeave={(e) => {
								if (!isSubmitting && !isLoading) {
									e.target.style.transform = 'translateY(0)';
									e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.3)';
								}
							}}
						>
							{isSubmitting || isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
						</button>
					</form>
				</div>
			</div>

			<style>{`
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				@keyframes slideDown {
					from {
						opacity: 0;
						transform: translateY(-10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</div>
	);
}
