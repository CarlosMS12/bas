import {useEffect, useRef} from 'react';

/**
 * Hook para gestionar caché de datos
 */
export function useCache(duration = 5 * 60 * 1000) {
	const cacheRef = useRef(new Map());

	const getCacheKey = (endpoint, params = {}) => {
		return `${endpoint}:${JSON.stringify(params)}`;
	};

	const get = (key) => {
		const item = cacheRef.current.get(key);
		if (!item) return null;

		if (Date.now() - item.timestamp > duration) {
			cacheRef.current.delete(key);
			return null;
		}
		return item.data;
	};

	const set = (key, data) => {
		cacheRef.current.set(key, {
			data,
			timestamp: Date.now(),
		});
	};

	const invalidate = (pattern) => {
		for (const key of cacheRef.current.keys()) {
			if (key.includes(pattern)) {
				cacheRef.current.delete(key);
			}
		}
	};

	const clear = () => {
		cacheRef.current.clear();
	};

	return {getCacheKey, get, set, invalidate, clear};
}

/**
 * Hook para controlar requests paralelas y cancelarlas
 */
export function useRequestController() {
	const tokensRef = useRef({
		filterOptions: Symbol('filterOptions'),
		studentsList: Symbol('studentsList'),
		search: Symbol('search'),
	});

	const activeRequestsRef = useRef(new Map());

	const startRequest = (token) => {
		activeRequestsRef.current.set(token, true);
		return token;
	};

	const isActive = (token) => {
		return (
			activeRequestsRef.current.has(token) && activeRequestsRef.current.get(token)
		);
	};

	const cancelRequest = (token) => {
		if (activeRequestsRef.current.has(token)) {
			activeRequestsRef.current.set(token, false);
		}
	};

	const cancelAllRequests = () => {
		for (const token of activeRequestsRef.current.keys()) {
			activeRequestsRef.current.set(token, false);
		}
	};

	return {
		tokens: tokensRef.current,
		startRequest,
		isActive,
		cancelRequest,
		cancelAllRequests,
	};
}
