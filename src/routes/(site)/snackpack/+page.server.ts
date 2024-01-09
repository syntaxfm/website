import type { PageServerLoad } from './$types';
// import env from svelte kit environment
import { env } from '$env/dynamic/private';

const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
const numberformatter = new Intl.NumberFormat('en-US');

const suffixes = new Map([
	['one', 'st'],
	['two', 'nd'],
	['few', 'rd'],
	['other', 'th']
]);

function formatNumber(n: number) {
	const rule = pr.select(n); // 'one', 'two', 'few', 'other'
	const suffix = suffixes.get(rule);
	return `${numberformatter.format(n)}${suffix}`;
}

export type Broadcast = {
	id: number;
	created_at: string;
	subject: string;
	description: string;
	content: string;
	public: boolean;
	published_at: string;
	send_at: string | null;
	thumbnail_alt: string | null;
	thumbnail_url: string | null;
	email_address: string;
	email_layout_template: string;
};

type BroadcastSkinny = Pick<Broadcast, 'id' | 'created_at' | 'subject'>;

type BroadCastResponse = {
	broadcasts: BroadcastSkinny[];
};

async function fetchBroadcastList() {
	// 1. Fetch all broadcasts from ConvertKit
	// 2 pages - 100 broadcasts should be enough. This will need to be updated if we ever have more than 100 issues
	const responses = await Promise.all([
		fetch(
			`https://api.convertkit.com/v3/broadcasts?page=1&api_secret=${env.CONVERT_KIT_SECRET}`
		).then((res) => res.json() as Promise<BroadCastResponse>),
		fetch(
			`https://api.convertkit.com/v3/broadcasts?page=2&api_secret=${env.CONVERT_KIT_SECRET}`
		).then((res) => res.json() as Promise<BroadCastResponse>)
	]);

	const broadcasts = responses
		// Flatten the array
		.map((res) => res.broadcasts)
		.flat()
		// Filter for past issues only
		.filter((broadcast) => {
			const date = new Date(broadcast.created_at);
			return date < new Date();
		})
		// Sort by date - newest first
		.sort((a, b) => {
			const aDate = new Date(a.created_at);
			const bDate = new Date(b.created_at);
			return aDate > bDate ? -1 : 1;
		})
		// Filter for subjects that contain "Snack Pack"
		.filter((broadcast) => {
			return broadcast.subject.toLowerCase().includes('snack pack');
		});

	// Now we need to hit the ConvertKit API for every single broadcast to get info on if this broadcast was published, as well as the associated HTML for each snackpack
	const broadcastsWithData = (
		await Promise.all(
			broadcasts.map(async (broadcast) => {
				const res = await fetch(
					`https://api.convertkit.com/v3/broadcasts/${broadcast.id}?api_secret=${env.CONVERT_KIT_SECRET}`
				);
				const data = await res.json();
				return data.broadcast as Broadcast;
			})
		)
	)
		// filter for public broadcasts
		.filter((broadcast) => broadcast.public)
		// trim to only the fields we need (published_at, subject)
		.map((broadcast) => {
			return {
				published_at: broadcast.published_at,
				subject: broadcast.subject,
				id: broadcast.id
			};
		});

	return broadcastsWithData;
}

export const load: PageServerLoad = async function ({ setHeaders, params, locals }) {
	// 1 min cache with 1 min stale allowed
	setHeaders({
		'cache-control': `public s-max-age=60, stale-while-revalidate=60`
	});

	const subs = await fetch(
		`https://api.convertkit.com/v3/subscribers?api_secret=${env.CONVERT_KIT_SECRET}`
	)
		.then((res) => res.json())
		.catch(console.error);

	const issues = env.CONVERT_KIT_SECRET
		? await fetchBroadcastList()
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
