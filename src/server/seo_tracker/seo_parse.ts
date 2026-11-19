import { as_array, as_number, as_string, is_record, read_path } from '#lib/utils/narrow.ts';
import { get_id_from_url } from '#lib/videos/utils.ts';
import type {
	Backlinks,
	Competitor,
	DomainOverview,
	GoogleResult,
	GoogleSearchCheck,
	GoogleVideoBoxResult,
	RankedKeyword,
	YoutubeChannel,
	YoutubeResult,
	YoutubeSearchCheck
} from './seo_report';

// Turns Alexandria response data into the snapshot's normalized shapes. Each parser throws when
// the response isn't usable, so the snapshot records that call as failed instead of storing zeros.

const DATAFORSEO_OK = 20000;
const TOP_LIST_LENGTH = 3;
// Results kept in detail per tracked search, so an agent can see what outranks Syntax and why.
// They come in the same response, so they cost nothing extra (about 180 kB per snapshot).
export const SEARCH_RESULT_DETAIL_LENGTH = 10;

// DataForSEO wraps every answer in { status_code, tasks: [{ status_code, result: [...] }] }
function read_dataforseo_task(data: unknown): unknown {
	const task = read_path(data, ['tasks', 0]);
	const status_code = as_number(read_path(task, ['status_code']));
	if (status_code !== DATAFORSEO_OK) {
		const message = as_string(read_path(task, ['status_message'])) ?? 'no task in response';
		throw new Error(`DataForSEO task failed (${status_code ?? 'no status'}): ${message}`);
	}
	return task;
}

function read_dataforseo_result(data: unknown): Record<string, unknown> {
	const result = read_path(read_dataforseo_task(data), ['result', 0]);
	if (!is_record(result)) throw new Error('DataForSEO task returned no result');
	return result;
}

function count(value: unknown): number {
	return as_number(value) ?? 0;
}

function strip_www(host: string): string {
	return host.toLowerCase().replace(/^www\./, '');
}

export function is_syntax_site(site: string | null, target_domain: string): boolean {
	return site !== null && (site === target_domain || site.endsWith(`.${target_domain}`));
}

function read_overview(organic: unknown): DomainOverview | null {
	if (!is_record(organic)) return null;
	return {
		keyword_count: count(organic.count),
		estimated_traffic: count(organic.etv),
		bands: {
			pos_1: count(organic.pos_1),
			pos_2_3: count(organic.pos_2_3),
			pos_4_10: count(organic.pos_4_10),
			pos_11_20: count(organic.pos_11_20),
			pos_21_100: [
				'pos_21_30',
				'pos_31_40',
				'pos_41_50',
				'pos_51_60',
				'pos_61_70',
				'pos_71_80',
				'pos_81_90',
				'pos_91_100'
			].reduce((total, band) => total + count(organic[band]), 0)
		},
		new_count: count(organic.is_new),
		up_count: count(organic.is_up),
		down_count: count(organic.is_down),
		lost_count: count(organic.is_lost)
	};
}

function read_ranked_keyword(item: unknown): RankedKeyword | null {
	const keyword_data = read_path(item, ['keyword_data']);
	const serp_element = read_path(item, ['ranked_serp_element']);
	const keyword = as_string(read_path(keyword_data, ['keyword']));
	const position = as_number(read_path(serp_element, ['serp_item', 'rank_group']));
	const url = as_string(read_path(serp_element, ['serp_item', 'url']));
	if (keyword === null || position === null || url === null) return null;
	return {
		keyword,
		search_volume: as_number(read_path(keyword_data, ['keyword_info', 'search_volume'])),
		position,
		url,
		keyword_difficulty: as_number(
			read_path(keyword_data, ['keyword_properties', 'keyword_difficulty'])
		),
		intent: as_string(read_path(keyword_data, ['search_intent_info', 'main_intent'])),
		has_ai_overview: as_array(read_path(serp_element, ['serp_item_types'])).includes('ai_overview')
	};
}

// domains/ranked-keywords: every keyword the domain ranks for, plus the domain's totals
export function parse_ranked_keywords(data: unknown): {
	overview: DomainOverview | null;
	keywords: RankedKeyword[];
} {
	const result = read_dataforseo_result(data);
	return {
		overview: read_overview(read_path(result, ['metrics', 'organic'])),
		keywords: as_array(result.items)
			.map(read_ranked_keyword)
			.filter((keyword): keyword is RankedKeyword => keyword !== null)
	};
}

// domains/competitors: the target itself comes back as the first row, so it is dropped
export function parse_competitors(data: unknown, target_domain: string): Competitor[] {
	const result = read_dataforseo_result(data);
	return as_array(result.items).flatMap((item): Competitor[] => {
		const domain = as_string(read_path(item, ['domain']));
		if (domain === null || domain === target_domain) return [];
		return [
			{
				domain,
				shared_keywords: count(read_path(item, ['intersections'])),
				average_position: count(read_path(item, ['avg_position'])),
				estimated_traffic: count(read_path(item, ['full_domain_metrics', 'organic', 'etv']))
			}
		];
	});
}

// backlinks/summary
export function parse_backlinks(data: unknown): Backlinks {
	const result = read_dataforseo_result(data);
	return {
		rank: count(result.rank),
		backlinks: count(result.backlinks),
		referring_domains: count(result.referring_domains),
		broken_backlinks: count(result.broken_backlinks)
	};
}

// Google now links results through google.com/goto, so `domain` is often google.com. The real
// site is in the breadcrumb ("https://syntax.fm › show") or, failing that, its display name.
export function google_result_site(item: unknown): string | null {
	const domain = as_string(read_path(item, ['domain']));
	if (domain !== null && domain !== 'google.com') return strip_www(domain);
	const breadcrumb = as_string(read_path(item, ['breadcrumb']));
	const host = breadcrumb?.match(/^https?:\/\/([^\s/›]+)/)?.[1];
	if (host) return strip_www(host);
	// Google spaces these with non-breaking spaces ("Reddit · r/Frontend")
	return as_string(read_path(item, ['website_name']))?.replace(/\s+/gu, ' ') ?? null;
}

// The result's own page; a google.com/goto link hides it, so that gives null
function google_result_url(item: unknown): string | null {
	const url = as_string(read_path(item, ['url']));
	if (url === null || !URL.canParse(url)) return null;
	return strip_www(new URL(url).hostname) === 'google.com' ? null : url;
}

// What marks a search result as Syntax's
export type SyntaxIdentity = {
	domain: string;
	channel: YoutubeChannel;
	// Every Syntax episode's and video's YouTube id, from the database
	video_ids: ReadonlySet<string>;
	// Every Syntax episode's and video's title, as normalize_title gives it
	titles: ReadonlySet<string>;
};

// A Google title cut short ends in "..."; past this many letters a cut title is still Syntax's
const MIN_CUT_TITLE_LENGTH = 15;

/** Lowercase letters and numbers, single spaced, so titles compare across punctuation. */
export function normalize_title(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

function is_syntax_title(title: string, titles: ReadonlySet<string>): boolean {
	const is_cut = /(?:\.\.\.|…)\s*$/.test(title);
	const normalized = normalize_title(title);
	if (!is_cut) return titles.has(normalized);
	if (normalized.length < MIN_CUT_TITLE_LENGTH) return false;
	for (const syntax_title of titles) if (syntax_title.startsWith(normalized)) return true;
	return false;
}

// Google names a YouTube result's site "YouTube · Channel", or just "YouTube", "YouTube Music" or
// "youtube.com" when it doesn't say whose it is. Null for any other site.
export function read_youtube_site(site: string | null): { channel_name: string | null } | null {
	if (site === null) return null;
	if (/^(?:[a-z]+\.)?youtube\.com$/i.test(site)) return { channel_name: null };
	const match = site.match(/^YouTube(?: Music)?(?: · (.+))?$/i);
	return match ? { channel_name: match[1]?.trim() ?? null } : null;
}

// A YouTube video is Syntax's by its id, else by its channel, else (when Google doesn't name the
// channel, as for YouTube Music) by its title matching an episode's or video's
function is_syntax_video(
	site: string | null,
	title: string | null,
	url: string | null,
	syntax: SyntaxIdentity
): boolean {
	const video_id = get_id_from_url(url);
	if (video_id) return syntax.video_ids.has(video_id) || is_youtube_channel(site, syntax);
	const youtube = read_youtube_site(site);
	if (!youtube) return false;
	if (youtube.channel_name !== null) return is_youtube_channel(site, syntax);
	return title !== null && is_syntax_title(title, syntax.titles);
}

function is_youtube_channel(site: string | null, syntax: SyntaxIdentity): boolean {
	const channel_name = read_youtube_site(site)?.channel_name ?? null;
	return channel_name !== null && is_channel_video({ channel_name }, syntax.channel);
}

export function is_syntax_result(
	site: string | null,
	title: string | null,
	url: string | null,
	syntax: SyntaxIdentity
): boolean {
	return is_syntax_site(site, syntax.domain) || is_syntax_video(site, title, url, syntax);
}

// The first Syntax video in Google's video box (type "video": three or so YouTube videos)
function read_video_box(items: unknown[], syntax: SyntaxIdentity): GoogleVideoBoxResult | null {
	for (const item of items) {
		if (as_string(read_path(item, ['type'])) !== 'video') continue;
		const videos = as_array(read_path(item, ['items']));
		for (const [index, video] of videos.entries()) {
			const title = as_string(read_path(video, ['title']));
			const url = as_string(read_path(video, ['url']));
			const source = as_string(read_path(video, ['source']))?.replace(/\s+/gu, ' ') ?? null;
			if (is_syntax_video(source, title, url, syntax)) return { position: index + 1, title, url };
		}
	}
	return null;
}

// serp/google-organic for one tracked search
export function parse_google_search(
	search: string,
	data: unknown,
	syntax: SyntaxIdentity
): GoogleSearchCheck {
	const result = read_dataforseo_result(data);
	const items = as_array(result.items);
	const organic = items
		.filter((item) => as_string(read_path(item, ['type'])) === 'organic')
		.map((item) => {
			const site = google_result_site(item);
			const title = as_string(read_path(item, ['title']));
			const url = google_result_url(item);
			return {
				position: as_number(read_path(item, ['rank_group'])),
				title,
				url,
				site,
				description: as_string(read_path(item, ['description'])),
				is_syntax: is_syntax_result(site, title, url, syntax)
			};
		});
	const syntax_result = organic.find((item) => item.is_syntax);
	return {
		search,
		syntax_position: syntax_result?.position ?? null,
		syntax_title: syntax_result?.title ?? null,
		syntax_url: syntax_result?.url ?? null,
		syntax_site: syntax_result?.site ?? null,
		syntax_video_box: read_video_box(items, syntax),
		result_types: as_array(result.item_types).filter(
			(type): type is string => typeof type === 'string'
		),
		top_sites: organic
			.slice(0, TOP_LIST_LENGTH)
			.map((item) => item.site)
			.filter((site): site is string => site !== null),
		top_results: organic.slice(0, SEARCH_RESULT_DETAIL_LENGTH).map(
			(item): GoogleResult => ({
				position: item.position,
				title: item.title,
				url: item.url,
				domain: item.site,
				description: item.description,
				is_syntax: item.is_syntax
			})
		)
	};
}

export type SearchVolume = { search_volume: number | null; monthly: number[] };

// keywords/search-volume: one row per keyword (not under result[0].items like the Labs calls),
// with its monthly searches newest first
export function parse_search_volume(data: unknown): Map<string, SearchVolume> {
	const volumes = new Map<string, SearchVolume>();
	for (const row of as_array(read_path(read_dataforseo_task(data), ['result']))) {
		const keyword = as_string(read_path(row, ['keyword']));
		if (keyword === null) continue;
		const months = as_array(read_path(row, ['monthly_searches']))
			.map((month) => ({
				order:
					(as_number(read_path(month, ['year'])) ?? 0) * 12 +
					(as_number(read_path(month, ['month'])) ?? 0),
				searches: count(read_path(month, ['search_volume']))
			}))
			.sort((a, b) => a.order - b.order);
		volumes.set(keyword.toLowerCase(), {
			search_volume: as_number(read_path(row, ['search_volume'])),
			monthly: months.map((month) => month.searches)
		});
	}
	return volumes;
}

// keywords/difficulty: 0 to 100 for each keyword
export function parse_keyword_difficulty(data: unknown): Map<string, number> {
	const result = read_dataforseo_result(data);
	const difficulties = new Map<string, number>();
	for (const item of as_array(result.items)) {
		const keyword = as_string(read_path(item, ['keyword']));
		const difficulty = as_number(read_path(item, ['keyword_difficulty']));
		if (keyword !== null && difficulty !== null)
			difficulties.set(keyword.toLowerCase(), difficulty);
	}
	return difficulties;
}

// Collab videos ("Syntax and Scott Tolinski") come back with no channel id, only the joint name
export function is_channel_video(video: Record<string, unknown>, channel: YoutubeChannel): boolean {
	const video_channel_id = as_string(video.channel_id);
	if (video_channel_id !== null) return video_channel_id === channel.id;
	const name = as_string(video.channel_name);
	return (
		name !== null &&
		(name === channel.name ||
			name.startsWith(`${channel.name} and `) ||
			name.endsWith(` and ${channel.name}`))
	);
}

// "14,344 views" or "1 view" as a number; null for text without one ("No views" counts as 0)
export function parse_view_count(view_count_text: string | null): number | null {
	if (view_count_text === null) return null;
	if (/^no views$/i.test(view_count_text.trim())) return 0;
	const digits = view_count_text.match(/^\s*([\d,]+)\s+views?\b/i)?.[1];
	return digits ? Number(digits.replaceAll(',', '')) : null;
}

function read_youtube_videos(data: unknown): Record<string, unknown>[] {
	const videos = read_path(data, ['videos']);
	if (!Array.isArray(videos)) throw new Error('YouTube search returned no video list');
	return videos.filter(is_record);
}

/** The token for a search's next page of results; null on the last page. */
export function read_youtube_continuation(data: unknown): string | null {
	return as_string(read_path(data, ['continuation']));
}

/** Whether a page of YouTube results has one of the channel's videos. */
export function has_channel_video(data: unknown, channel: YoutubeChannel): boolean {
	return read_youtube_videos(data).some((video) => is_channel_video(video, channel));
}

// youtube-com videos/search_videos for one tracked search: its pages of results, first page first
export function parse_youtube_search(
	search: string,
	pages: readonly unknown[],
	channel: YoutubeChannel
): YoutubeSearchCheck {
	const videos = pages.flatMap(read_youtube_videos);
	const syntax_index = videos.findIndex((video) => is_channel_video(video, channel));
	const syntax_video = syntax_index === -1 ? null : videos[syntax_index];
	const channel_names = videos
		.map((video) => as_string(video.channel_name))
		.filter((name): name is string => name !== null);
	return {
		search,
		syntax_position: syntax_index === -1 ? null : syntax_index + 1,
		syntax_video_title: syntax_video ? as_string(syntax_video.title) : null,
		syntax_video_url: syntax_video ? as_string(syntax_video.url) : null,
		top_channels: [...new Set(channel_names)].slice(0, TOP_LIST_LENGTH),
		top_results: videos.slice(0, SEARCH_RESULT_DETAIL_LENGTH).map(
			(video, index): YoutubeResult => ({
				position: index + 1,
				title: as_string(video.title),
				url: as_string(video.url),
				video_id: as_string(video.video_id),
				channel_name: as_string(video.channel_name),
				channel_handle: as_string(video.channel_handle),
				view_count: parse_view_count(as_string(video.view_count_text)),
				length_text: as_string(video.length_text),
				published_text: as_string(video.published_text),
				description_snippet: as_string(video.description_snippet),
				is_syntax: is_channel_video(video, channel)
			})
		)
	};
}
