import { redis } from '../../../../hooks.server';

export const load = async () => {
	return {
		cache: redis.keys('*')
	};
};
