import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter as Router} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import {StudentProvider} from './context/StudentContext';
import App from './App';
import './styles/main.css';

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Router>
			<AuthProvider>
				<StudentProvider>
					<App />
				</StudentProvider>
			</AuthProvider>
		</Router>
	</React.StrictMode>
);
