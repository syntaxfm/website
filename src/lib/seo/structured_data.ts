// schema.org JSON-LD, so search engines and AI agents can read who, what and when without guessing.
import { PODCAST_FEED_URL, PODCAST_LINKS, SITE_DESCRIPTION } from '$const';
import { get_faces_from_show, type Face } from '#lib/hosts/hosts_utils.ts';
import type { Guest, Host, Link } from '$server/db/types';

type JsonLd = { [key: string]: unknown };

// Edge-cached page data has been through JSON, so its dates arrive as ISO strings
type DateValue = Date | string;

export type EpisodeSchemaShow = {
	number: number;
	title: string;
	slug: string;
	date: DateValue;
	url: string;
	aiShowNote?: { description: string; links?: Pick<Link, 'name' | 'url'>[] } | null;
	guests: { guest: Pick<Guest, 'name' | 'name_slug' | 'twitter' | 'github' | 'url'> }[];
	hosts: { profile: Pick<Host, 'name' | 'username'> }[];
	meta?: {
		updated_at: DateValue;
		tags: { tag: { name: string; slug: string | null } }[];
	} | null;
};

function series_id(site_url: string): string {
	return `${site_url}/#series`;
}

function host_person(host: Face): JsonLd {
	return {
		'@type': 'Person',
		name: host.name,
		sameAs: host.github ? [`https://github.com/${host.github}`] : undefined
	};
}

function guest_person(
	guest: EpisodeSchemaShow['guests'][number]['guest'],
	site_url: string
): JsonLd {
	const same_as = [
		guest.twitter && `https://x.com/${guest.twitter}`,
		guest.github && `https://github.com/${guest.github}`,
		guest.url
	].filter(Boolean);
	return {
		'@type': 'Person',
		name: guest.name,
		url: `${site_url}/guest/${guest.name_slug}`,
		sameAs: same_as.length > 0 ? same_as : undefined
	};
}

// The later of two dates, as ISO. Migrated content can carry an updated_at older than the episode.
function latest_iso(first: DateValue, second: DateValue): string {
	return new Date(Math.max(new Date(first).getTime(), new Date(second).getTime())).toISOString();
}

/** The podcast itself, for Home. */
export function podcast_series_schema(site_url: string): JsonLd {
	const hosts = get_faces_from_show({ hosts: [], guests: [] });
	return {
		'@context': 'https://schema.org',
		'@type': 'PodcastSeries',
		'@id': series_id(site_url),
		name: 'Syntax',
		url: site_url,
		description: SITE_DESCRIPTION,
		image: `${site_url}/syntax-banner.png`,
		inLanguage: 'en',
		webFeed: PODCAST_FEED_URL,
		author: hosts.map(host_person),
		sameAs: PODCAST_LINKS.filter((link) => link.href !== PODCAST_FEED_URL).map((link) => link.href)
	};
}

/** One episode. Its url is always the canonical one, whichever slug the visitor came in on. */
export function podcast_episode_schema(show: EpisodeSchemaShow, site_url: string): JsonLd {
	const episode_url = `${site_url}/show/${show.number}/${show.slug}`;
	const hosts = get_faces_from_show(show).filter((face) => face.type === 'host');
	const guests = show.guests.map(({ guest }) => guest_person(guest, site_url));
	const tags = (show.meta?.tags ?? []).flatMap(({ tag }) =>
		tag.slug ? [{ '@type': 'Thing', name: tag.name, url: `${site_url}/tags/${tag.slug}` }] : []
	);
	const links = (show.aiShowNote?.links ?? []).map((link) => ({
		'@type': 'WebPage',
		name: link.name,
		url: link.url
	}));

	return {
		'@context': 'https://schema.org',
		'@type': 'PodcastEpisode',
		'@id': `${episode_url}#episode`,
		url: episode_url,
		name: show.title,
		episodeNumber: show.number,
		datePublished: new Date(show.date).toISOString(),
		dateModified: show.meta ? latest_iso(show.date, show.meta.updated_at) : undefined,
		description: show.aiShowNote?.description,
		image: `${site_url}/og/${show.number}.jpg`,
		inLanguage: 'en',
		associatedMedia: {
			'@type': 'AudioObject',
			contentUrl: show.url,
			encodingFormat: 'audio/mpeg'
		},
		partOfSeries: {
			'@type': 'PodcastSeries',
			'@id': series_id(site_url),
			name: 'Syntax',
			url: site_url,
			webFeed: PODCAST_FEED_URL
		},
		author: hosts.map(host_person),
		contributor: guests.length > 0 ? guests : undefined,
		about: tags.length > 0 ? tags : undefined,
		mentions: links.length > 0 ? links : undefined
	};
}

/**
 * JSON for a `<script type="application/ld+json">`. `<` and `&` become JSON unicode escapes: the
 * text can never close the script element and is left untouched by Svelte's text escaping, while
 * JSON parsers decode it back to the same data.
 */
export function to_json_ld(schema: JsonLd): string {
	return JSON.stringify(schema).replaceAll('<', '\\u003c').replaceAll('&', '\\u0026');
}
