import { cache_status, redis } from '../../../../hooks.server';

export const load = async () => {
	return {
		cache: cache_status === 'ONLINE' ? redis?.keys('*') : ['Cache offline']
	};
};
