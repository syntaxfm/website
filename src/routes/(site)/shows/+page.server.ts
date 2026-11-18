import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// /shows became /videos: episodes and videos together. Its ?page and ?perPage carry over.
export const load: PageServerLoad = ({ url }) => {
	redirect(301, '/videos' + url.search);
};
