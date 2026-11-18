import { isHttpError } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The SEO tools' server functions: admins only, and a clear answer for an unknown search. The
// database is a stand-in whose select chain answers with `rows`.

const { select, rows } = vi.hoisted(() => {
	const rows: { value: unknown[] } = { value: [] };
	const chain = {
		from: () => chain,
		orderBy: () => chain,
		limit: () => Promise.resolve(rows.value)
	};
	return { select: vi.fn(() => chain), rows };
});

vi.mock('$server/db/client', () => ({ db: { select } }));
vi.mock('./seo_topics', () => ({ get_seo_topic_names: vi.fn(async () => ['CSS']) }));

const seo_queries = await import('./seo_queries');

const non_admin = { id: 'central-user-1', profile_id: 'profile-1', roles: [] };
const admin = { ...non_admin, roles: ['admin'] };
const search_input = { search: 'ai engineering', platform: 'both' as const, history_limit: 8 };

async function refusal_of(run: () => Promise<unknown>) {
	try {
		await run();
	} catch (refusal) {
		if (isHttpError(refusal)) return { status: refusal.status, message: refusal.body.message };
		throw refusal;
	}
	return null;
}

describe('SEO tool reads', () => {
	beforeEach(() => {
		select.mockClear();
		rows.value = [];
	});

	it.each([
		['get_seo_overview', () => seo_queries.get_seo_overview(non_admin)],
		['list_seo_searches', () => seo_queries.list_seo_searches(non_admin)],
		['get_seo_search', () => seo_queries.get_seo_search(non_admin, search_input)],
		['search_seo_keywords', () => seo_queries.search_seo_keywords(non_admin, {})],
		['list_seo_opportunities', () => seo_queries.list_seo_opportunities(non_admin, 20)]
	])('%s refuses someone without the admin role before reading', async (_name, run) => {
		expect(await refusal_of(run)).toEqual({ status: 403, message: 'Admin access required' });
		expect(select).not.toHaveBeenCalled();
	});

	it('says when no snapshot has been taken', async () => {
		expect(await refusal_of(() => seo_queries.get_seo_overview(admin))).toEqual({
			status: 404,
			message: 'No SEO snapshot has been taken yet.'
		});
	});

	it('points an unknown search to list_seo_searches', async () => {
		rows.value = [{ taken_at: new Date(), google: null, youtube: null, demand: null }];

		expect(
			await refusal_of(() => seo_queries.get_seo_search(admin, { ...search_input, search: 'Nope' }))
		).toEqual({
			status: 404,
			message: '"Nope" isn\'t a tracked search. list_seo_searches lists them.'
		});
	});

	it('filters the latest keywords with the shared topic names', async () => {
		const ranked = (name: string, position: number) => ({
			keyword: name,
			search_volume: 100,
			position,
			url: 'https://syntax.fm/',
			keyword_difficulty: null,
			intent: null,
			has_ai_overview: false
		});
		rows.value = [
			{ taken_at: new Date(), keywords: [ranked('css grid', 5), ranked('song lyrics', 9)] }
		];

		const result = await seo_queries.search_seo_keywords(admin, {});

		expect(result).toMatchObject({
			ranked_keyword_count: 2,
			total_matches: 1,
			limit: 25,
			offset: 0,
			items: [{ keyword: 'css grid' }]
		});
	});
});
