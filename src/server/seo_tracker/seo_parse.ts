import { as_array, as_number, as_string, is_record, read_path } from '#lib/utils/narrow.ts';
import type {
	Backlinks,
	Competitor,
	DomainOverview,
	GoogleSearchCheck,
	RankedKeyword,
	YoutubeChannel,
	YoutubeSearchCheck
} from './seo_report';

// Turns Alexandria response data into the snapshot's normalized shapes. Each parser throws when
// the response isn't usable, so the snapshot records that call as failed instead of storing zeros.

const DATAFORSEO_OK = 20000;
const TOP_LIST_LENGTH = 3;

// DataForSEO wraps every answer in { status_code, tasks: [{ status_code, result: [...] }] }
function read_dataforseo_result(data: unknown): Record<string, unknown> {
	const task = read_path(data, ['tasks', 0]);
	const status_code = as_number(read_path(task, ['status_code']));
	if (status_code !== DATAFORSEO_OK) {
		const message = as_string(read_path(task, ['status_message'])) ?? 'no task in response';
		throw new Error(`DataForSEO task failed (${status_code ?? 'no status'}): ${message}`);
	}
	const result = read_path(task, ['result', 0]);
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

// serp/google-organic for one tracked search
export function parse_google_search(
	search: string,
	data: unknown,
	target_domain: string
): GoogleSearchCheck {
	const result = read_dataforseo_result(data);
	const organic = as_array(result.items).filter(
		(item) => as_string(read_path(item, ['type'])) === 'organic'
	);
	const syntax_result = organic.find((item) =>
		is_syntax_site(google_result_site(item), target_domain)
	);
	return {
		search,
		syntax_position: syntax_result ? as_number(read_path(syntax_result, ['rank_group'])) : null,
		syntax_title: syntax_result ? as_string(read_path(syntax_result, ['title'])) : null,
		result_types: as_array(result.item_types).filter(
			(type): type is string => typeof type === 'string'
		),
		top_sites: organic
			.slice(0, TOP_LIST_LENGTH)
			.map(google_result_site)
			.filter((site): site is string => site !== null)
	};
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

// youtube-com videos/search_videos for one tracked search
export function parse_youtube_search(
	search: string,
	data: unknown,
	channel: YoutubeChannel
): YoutubeSearchCheck {
	const videos_value = read_path(data, ['videos']);
	if (!Array.isArray(videos_value)) throw new Error('YouTube search returned no video list');
	const videos = videos_value.filter(is_record);
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
		top_channels: [...new Set(channel_names)].slice(0, TOP_LIST_LENGTH)
	};
}
