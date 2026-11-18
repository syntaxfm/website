import type {
	AiShowNote,
	AiSummaryEntry,
	AiTweet,
	Content,
	Guest,
	Link,
	SocialLink,
	Topic,
	Video
} from '$server/db/types';
import get_show_path from '$utilities/slug';

// What MCP tools answer with: the server functions' rows cut to what an agent needs. Whole Show
// rows and article bodies stay out of lists, so a page of results stays small, and a Profile is
// only ever its public name fields, never its email or central User ID.

interface TagLink {
	tag: { id: string; name: string; slug: string | null };
}

interface PublicProfile {
	id: string;
	name: string | null;
	username: string | null;
	twitter?: string | null;
}

function project_tags(tags: TagLink[]) {
	return tags.map(({ tag }) => ({ id: tag.id, name: tag.name, slug: tag.slug }));
}

function project_profile(profile: PublicProfile) {
	return { id: profile.id, name: profile.name, username: profile.username };
}

function project_show_link(show: { number: number; slug: string }) {
	return { number: show.number, slug: show.slug, path: get_show_path(show) };
}

export function project_guest(guest: Guest) {
	return {
		id: guest.id,
		name: guest.name,
		name_slug: guest.name_slug,
		of: guest.of,
		twitter: guest.twitter,
		github: guest.github,
		url: guest.url
	};
}

interface ShowSummaryRow {
	number: number;
	title: string;
	slug: string;
	date: Date;
	url: string;
	youtube_url: string | null;
	show_type: string;
	content_id: string | null;
	meta: Pick<Content, 'status' | 'published_at'> | null;
}

export function project_show_summary(show: ShowSummaryRow) {
	return {
		...project_show_link(show),
		title: show.title,
		date: show.date,
		status: show.meta?.status ?? null,
		published_at: show.meta?.published_at ?? null,
		show_type: show.show_type,
		url: show.url,
		youtube_url: show.youtube_url,
		content_id: show.content_id
	};
}

interface ShowDetailRow extends ShowSummaryRow {
	show_notes: string;
	meta: (Pick<Content, 'status' | 'published_at'> & { tags: TagLink[] }) | null;
	guests: { guest: Guest }[];
	hosts: { profile: PublicProfile }[];
	transcript: object | null;
	aiShowNote:
		| (Pick<AiShowNote, 'id' | 'title' | 'description'> & {
				summary: AiSummaryEntry[];
				links: Link[];
				topics: Topic[];
				tweets: AiTweet[];
		  })
		| null;
}

export function project_show_detail(show: ShowDetailRow) {
	const ai_notes = show.aiShowNote;
	return {
		...project_show_summary(show),
		show_notes: show.show_notes,
		tags: project_tags(show.meta?.tags ?? []),
		guests: show.guests.map(({ guest }) => project_guest(guest)),
		hosts: show.hosts.map(({ profile }) => project_profile(profile)),
		has_transcript: show.transcript !== null,
		ai_notes: ai_notes
			? {
					id: ai_notes.id,
					title: ai_notes.title,
					description: ai_notes.description,
					summary: ai_notes.summary.map(({ time, text, description }) => ({
						time,
						text,
						description
					})),
					links: ai_notes.links.map(({ name, url, timestamp }) => ({ name, url, timestamp })),
					topics: ai_notes.topics.map(({ name }) => name),
					tweets: ai_notes.tweets.map(({ content }) => content)
				}
			: null
	};
}

interface ContentSummaryRow extends Pick<
	Content,
	'id' | 'type' | 'title' | 'slug' | 'status' | 'published_at' | 'updated_at'
> {
	show: { number: number; slug: string } | null;
	video: Pick<Video, 'id' | 'url'> | null;
}

export function project_content_summary(item: ContentSummaryRow) {
	return {
		id: item.id,
		type: item.type,
		title: item.title,
		slug: item.slug,
		status: item.status,
		published_at: item.published_at,
		updated_at: item.updated_at,
		show: item.show ? project_show_link(item.show) : null,
		video: item.video ? { youtube_id: item.video.id, url: item.video.url } : null
	};
}

export function project_tagged_content_summary(item: ContentSummaryRow & { tags: TagLink[] }) {
	return { ...project_content_summary(item), tags: project_tags(item.tags) };
}

interface ContentDetailRow extends ContentSummaryRow {
	created_at: Date;
	tags: TagLink[];
	show: { number: number; slug: string; url: string; youtube_url: string | null } | null;
	video: Video | null;
	article: { body: string; author: PublicProfile } | null;
}

export function project_content_detail(item: ContentDetailRow) {
	return {
		...project_tagged_content_summary(item),
		created_at: item.created_at,
		show: item.show
			? { ...project_show_link(item.show), url: item.show.url, youtube_url: item.show.youtube_url }
			: null,
		video: item.video
			? {
					youtube_id: item.video.id,
					url: item.video.url,
					description: item.video.description,
					thumbnail: item.video.thumbnail,
					duration_seconds: item.video.duration_seconds,
					view_count: item.video.view_count
				}
			: null,
		article: item.article
			? { body: item.article.body, author: project_profile(item.article.author) }
			: null
	};
}

export function project_guest_detail(
	guest: Guest & {
		socialLinks: SocialLink[];
		shows: { number: number; slug: string; title: string; date: Date }[];
	}
) {
	return {
		...project_guest(guest),
		social_links: guest.socialLinks.map(({ id, link }) => ({ id, link })),
		shows: guest.shows.map((show) => ({
			...project_show_link(show),
			title: show.title,
			date: show.date
		}))
	};
}
