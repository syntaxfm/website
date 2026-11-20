import * as Sentry from '@sentry/sveltekit';
import { chunk } from '#lib/utils/chunk.ts';
import { scrape_markdown, type ScrapedPage } from './firecrawl_scrape';
import { SYNTAX_SPOTIFY_SHOW_ID } from './seo_config';
import { SEARCH_RESULT_DETAIL_LENGTH, TOP_LIST_LENGTH } from './seo_parse';
import type {
	SeoCallError,
	SpotifyEpisodeResult,
	SpotifySearchCheck,
	SpotifyShowResult
} from './seo_report';

// Where Syntax shows up when someone searches Spotify for a tracked search, from Spotify's search
// page as a logged-out listener sees it, read through Firecrawl.

const CAPABILITY = 'firecrawl open.spotify.com/search';
// Pages loaded at once, to stay under Firecrawl's limit on browsers running together
const PAGES_AT_ONCE = 5;
const DESCRIPTION_SNIPPET_LENGTH = 200;

// Lines of Firecrawl's markdown for the search page. Text in links keeps markdown escapes ("\#501").
const LINK_TEXT = String.raw`((?:\\.|[^\]\\])+)`;
const SECTION_HEADING =
	/^## \[[^\]]*\]\(https:\/\/open\.spotify\.com\/search\/[^/)]+\/(podcasts|episodes)\)$/;
const SHOW_LINK = new RegExp(
	String.raw`^\[${LINK_TEXT}\]\(https://open\.spotify\.com/show/(\w+)\)$`
);
const EPISODE_HEADING = new RegExp(
	String.raw`^### \[${LINK_TEXT}\]\(https://open\.spotify\.com/episode/(\w+)\)$`
);
const EPISODE_END = '* * *';
const PUBLISHED =
	/^((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}(, \d{4})?|(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Today|Yesterday|\d+ (min|hr|hour|day)s? ago)$/;
const LENGTH = /^\d+ (hr|min|sec)( \d+ (min|sec))*$/;

/** Spotify's search page for podcasts and episodes. */
export function spotify_search_url(search: string): string {
	return `https://open.spotify.com/search/${encodeURIComponent(search)}/podcastAndEpisodes`;
}

function unescape_markdown(text: string): string {
	return text.replace(/\\([\\`*_{}[\]()#+\-.!|<>~])/g, '$1').trim();
}

function show_url(show_id: string): string {
	return `https://open.spotify.com/show/${show_id}`;
}

/** The non-empty lines under the page's Podcasts & Shows and Episodes headings. */
function read_sections(markdown: string): { shows: string[]; episodes: string[] } {
	const sections = { shows: [] as string[], episodes: [] as string[] };
	let current: string[] | null = null;
	for (const raw_line of markdown.split('\n')) {
		const line = raw_line.trim();
		if (line === '') continue;
		const heading = line.match(SECTION_HEADING);
		if (heading) {
			current = heading[1] === 'podcasts' ? sections.shows : sections.episodes;
		} else if (line.startsWith('## ')) {
			current = null;
		} else {
			current?.push(line);
		}
	}
	return sections;
}

// Each show is its linked name, then its publisher
function read_shows(lines: readonly string[]): SpotifyShowResult[] {
	return lines
		.flatMap((line, index) => {
			const link = line.match(SHOW_LINK);
			if (!link) return [];
			const next = lines[index + 1];
			const has_publisher = next !== undefined && !next.startsWith('[') && !next.startsWith('![');
			return [
				{
					name: unescape_markdown(link[1]),
					show_id: link[2],
					publisher: has_publisher ? unescape_markdown(next) : null
				}
			];
		})
		.map((show, index) => ({
			position: index + 1,
			name: show.name,
			url: show_url(show.show_id),
			publisher: show.publisher,
			is_syntax: show.show_id === SYNTAX_SPOTIFY_SHOW_ID
		}));
}

// Each episode is its linked title, its show, a description, when it came out and how long it
// is, then a divider
function read_episodes(lines: readonly string[]): SpotifyEpisodeResult[] {
	return lines
		.flatMap((line, index) => {
			const heading = line.match(EPISODE_HEADING);
			if (!heading) return [];
			const end = lines.indexOf(EPISODE_END, index + 1);
			const body = lines.slice(index + 1, end === -1 ? undefined : end);
			const show = body[0]?.match(SHOW_LINK) ?? null;
			const details = show ? body.slice(1) : body;
			const published_text = details.find((detail) => PUBLISHED.test(detail)) ?? null;
			const length_text = details.find((detail) => LENGTH.test(detail)) ?? null;
			const description = details
				.filter((detail) => detail !== published_text && detail !== length_text)
				.join(' ');
			return [
				{
					title: unescape_markdown(heading[1]),
					url: `https://open.spotify.com/episode/${heading[2]}`,
					show_name: show ? unescape_markdown(show[1]) : null,
					show_url: show ? show_url(show[2]) : null,
					published_text,
					length_text,
					description_snippet: description
						? unescape_markdown(description).slice(0, DESCRIPTION_SNIPPET_LENGTH)
						: null,
					is_syntax: show?.[2] === SYNTAX_SPOTIFY_SHOW_ID
				}
			];
		})
		.map((episode, index) => ({ position: index + 1, ...episode }));
}

/** Syntax's place in one Spotify search page, from Firecrawl's markdown of it. */
export function parse_spotify_search(search: string, markdown: string): SpotifySearchCheck {
	const sections = read_sections(markdown);
	const shows = read_shows(sections.shows);
	const episodes = read_episodes(sections.episodes);
	if (shows.length === 0 && episodes.length === 0) {
		throw new Error(
			"Spotify's search page had no shows or episodes, so its layout may have changed"
		);
	}
	const syntax_show = shows.find((show) => show.is_syntax);
	const syntax_episode = episodes.find((episode) => episode.is_syntax);
	return {
		search,
		syntax_show_position: syntax_show?.position ?? null,
		syntax_episode_position: syntax_episode?.position ?? null,
		syntax_episode_title: syntax_episode?.title ?? null,
		syntax_episode_url: syntax_episode?.url ?? null,
		top_shows: shows.slice(0, TOP_LIST_LENGTH).map((show) => show.name),
		show_results: shows,
		top_results: episodes.slice(0, SEARCH_RESULT_DETAIL_LENGTH)
	};
}

type SpotifyOutcome = {
	check: SpotifySearchCheck | null;
	error: SeoCallError | null;
	credits_cost: number;
};

// A failure is reported (and sent to Sentry), never thrown, so one bad page doesn't lose the rest
async function check_spotify_search(
	search: string,
	api_key: string,
	fetch_fn: typeof fetch
): Promise<SpotifyOutcome> {
	const fail = (code: string, failure: unknown, credits_cost: number): SpotifyOutcome => {
		console.error(`Spotify search "${search}" failed`, failure);
		Sentry.captureException(failure);
		return {
			check: null,
			credits_cost,
			error: {
				capability: CAPABILITY,
				subject: search,
				code,
				message: failure instanceof Error ? failure.message : String(failure)
			}
		};
	};

	let page: ScrapedPage;
	try {
		page = await scrape_markdown(spotify_search_url(search), api_key, fetch_fn);
	} catch (scrape_error) {
		return fail('scrape_failed', scrape_error, 0);
	}
	try {
		return {
			check: parse_spotify_search(search, page.markdown),
			error: null,
			credits_cost: page.credits_cost
		};
	} catch (parse_error) {
		return fail('unreadable_response', parse_error, page.credits_cost);
	}
}

/** Every search's Spotify check, in order. Failed searches are left out and listed in errors. */
export async function check_spotify_searches(
	searches: readonly string[],
	api_key: string,
	fetch_fn: typeof fetch = fetch
): Promise<{ checks: SpotifySearchCheck[]; errors: SeoCallError[]; credits_cost: number }> {
	const outcomes: SpotifyOutcome[] = [];
	for (const batch of chunk(searches, PAGES_AT_ONCE)) {
		outcomes.push(
			...(await Promise.all(batch.map((search) => check_spotify_search(search, api_key, fetch_fn))))
		);
	}
	return {
		checks: outcomes.flatMap((outcome) => (outcome.check ? [outcome.check] : [])),
		errors: outcomes.flatMap((outcome) => (outcome.error ? [outcome.error] : [])),
		credits_cost: outcomes.reduce((total, outcome) => total + outcome.credits_cost, 0)
	};
}
