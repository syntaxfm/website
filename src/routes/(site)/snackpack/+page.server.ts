import type { PageServerLoad } from './$types';
// import env from svelte kit environment
import { env } from '$env/dynamic/private';
import { super_cache_mang } from '$/server/cache/cache_mang';

const numberformatter = new Intl.NumberFormat('en-US');

function formatNumber(n: number) {
	return `${numberformatter.format(n)}`;
}

export type Broadcast = {
	id: number;
	publication_id: string;
	created_at: string;
	subject: string;
	description: string;
	content: string;
	public: boolean;
	published_at: string | null;
	send_at: string | null;
	thumbnail_alt: string | null;
	thumbnail_url: string | null;
	email_address: string;
	email_layout_template: string;
};

export type Pagination = {
	has_previous_page: boolean;
	has_next_page: boolean;
	start_cursor: string;
	end_cursor: string;
	per_page: number;
};

type BroadcastSkinny = Pick<Broadcast, 'id' | 'published_at' | 'created_at' | 'subject'>;

type BroadCastResponse = {
	broadcasts: Broadcast[];
	pagination: Pagination;
};

async function getBroadcastsPage(after?: string) {
	const params = new URLSearchParams();
	if (after) {
		params.append('after', after);
	}
	const response = await fetch(`https://api.convertkit.com/v4/broadcasts?${params.toString()}`, {
		headers: {
			'X-Kit-Api-Key': env.CONVERT_KIT_V4_API_KEY
		}
	});
	return response.json() as Promise<BroadCastResponse | undefined>;
}

async function fetchBroadcastList() {
	try {
		const results: BroadcastSkinny[] = [];
		let current_response: BroadCastResponse | undefined = {
			broadcasts: [],
			pagination: {
				has_previous_page: false,
				has_next_page: true,
				start_cursor: '',
				end_cursor: '',
				per_page: 50
			}
		};
		const now = new Date();
		while (current_response?.pagination.has_next_page) {
			current_response = await getBroadcastsPage(current_response.pagination.end_cursor);
			current_response?.broadcasts.forEach(
				({ id, published_at, created_at, subject, public: isPublic }) => {
					const is_published = new Date(published_at || created_at) <= now && isPublic;
					const title = subject.toLowerCase();
					const is_snackpack_issue = title.includes('snack pack') || title.includes('issue #');
					if (is_published || is_snackpack_issue) {
						results.push({
							id,
							published_at,
							created_at,
							subject
						});
					}
				}
			);
		}

		return results.sort(
			(a, b) =>
				new Date(b.published_at || b.created_at).getTime() -
				new Date(a.published_at || a.created_at).getTime()
		);
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async function ({ setHeaders }) {
	// 1 min cache with 1 min stale allowed
	setHeaders({
		'cache-control': `public s-maxage=60, stale-while-revalidate=60`
	});

	const subs = await super_cache_mang('snackpack:subs', () =>
		fetch(`https://api.convertkit.com/v3/subscribers?api_secret=${env.CONVERT_KIT_SECRET}`)
			.then((res) => res.json())
			.catch(console.error)
	);

	const issues = env.CONVERT_KIT_SECRET
		? await super_cache_mang('snackpack:issues', () => fetchBroadcastList())
		: [
				{
					published_at: Date.now(),
					subject: 'ConvertKit API key not set (this is a fake issue)',
					id: 1337
				}
			];
	const count =
		typeof subs?.total_subscribers === 'number' ? formatNumber(subs.total_subscribers) : '';

	return {
		count,
		issues,
		meta: {
			title: 'Syntax Newsletter • Tips, tricks, swag drops and more'
		}
	};
};
