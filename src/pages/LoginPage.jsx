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
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				fontFamily:
					"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
			}}
		>
			<div
				style={{
					background: 'white',
					padding: '48px 40px',
					borderRadius: '12px',
					boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
					width: '100%',
					maxWidth: '400px',
				}}
			>
				<h1
					style={{
						fontSize: '28px',
						fontWeight: '600',
						marginBottom: '8px',
						textAlign: 'center',
						color: '#212121',
					}}
				>
					Sistema de Estudiantes
				</h1>
				<p
					style={{
						color: '#757575',
						textAlign: 'center',
						marginBottom: '32px',
						fontSize: '14px',
					}}
				>
					Inicia sesión con tu cuenta
				</p>

				<form
					onSubmit={handleSubmit}
					style={{display: 'flex', flexDirection: 'column', gap: '16px'}}
				>
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<label
							htmlFor="email"
							style={{
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '500',
								color: '#212121',
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
								padding: '12px 16px',
								border: '1px solid #e0e0e0',
								borderRadius: '8px',
								fontSize: '14px',
								fontFamily: 'inherit',
								transition: 'all 0.2s ease',
								outline: 'none',
							}}
							onFocus={(e) => {
								e.target.style.borderColor = '#1976d2';
								e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
							}}
							onBlur={(e) => {
								e.target.style.borderColor = '#e0e0e0';
								e.target.style.boxShadow = 'none';
							}}
						/>
					</div>

					<div style={{display: 'flex', flexDirection: 'column'}}>
						<label
							htmlFor="password"
							style={{
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '500',
								color: '#212121',
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
								padding: '12px 16px',
								border: '1px solid #e0e0e0',
								borderRadius: '8px',
								fontSize: '14px',
								fontFamily: 'inherit',
								transition: 'all 0.2s ease',
								outline: 'none',
							}}
							onFocus={(e) => {
								e.target.style.borderColor = '#1976d2';
								e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
							}}
							onBlur={(e) => {
								e.target.style.borderColor = '#e0e0e0';
								e.target.style.boxShadow = 'none';
							}}
						/>
					</div>

					<button
						type="submit"
						disabled={isSubmitting || isLoading}
						style={{
							background: isSubmitting ? '#90caf9' : '#1976d2',
							color: 'white',
							border: 'none',
							padding: '12px 24px',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: isSubmitting ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s ease',
							marginTop: '8px',
						}}
						onMouseEnter={(e) => {
							if (!isSubmitting) e.target.style.background = '#1565c0';
						}}
						onMouseLeave={(e) => {
							if (!isSubmitting) e.target.style.background = '#1976d2';
						}}
					>
						{isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
					</button>
				</form>

				{notification && (
					<Notification
						message={notification.message}
						type={notification.type}
						onClose={() => setNotification(null)}
					/>
				)}
			</div>
		</div>
	);
}
