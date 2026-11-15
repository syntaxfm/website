// /llms.txt (https://llmstxt.org): a Markdown map of the site for AI agents. It says where the
// episodes, transcripts, topics and guests live, so an agent can go straight to the right page.
import { PODCAST_FEED_URL } from '$const';

export type LlmsEpisode = {
	number: number;
	title: string;
	slug: string;
	description: string | null;
	has_transcript: boolean;
};

export type LlmsTopic = {
	name: string;
	slug: string;
	count: number;
};

export type LlmsTxtInput = {
	site_url: string;
	episode_count: number;
	latest_episodes: LlmsEpisode[];
	topics: LlmsTopic[];
};

// Link text can't hold a bare `[` or `]`, and a list item must stay on one line
function link_text(text: string): string {
	return one_line(text).replace(/[[\]]/g, '\\$&');
}

function one_line(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function episode_line(site_url: string, episode: LlmsEpisode): string {
	const url = `${site_url}/show/${episode.number}/${episode.slug}`;
	const description = episode.description ? `: ${one_line(episode.description)}` : '';
	const transcript = episode.has_transcript ? ` [Transcript](${url}/transcript)` : '';
	return `- [#${episode.number}: ${link_text(episode.title)}](${url})${description}${transcript}`;
}

export function llms_txt({
	site_url,
	episode_count,
	latest_episodes,
	topics
}: LlmsTxtInput): string {
	return [
		'# Syntax',
		'',
		`> Syntax is a web development podcast hosted by Wes Bos and Scott Tolinski. ${episode_count} episodes cover JavaScript, TypeScript, CSS, frameworks, tooling, servers and the business of being a developer.`,
		'',
		`Every episode has a page at ${site_url}/show/{number}/{slug} with show notes and links. Most have a full transcript, with speaker names and timestamps, at ${site_url}/show/{number}/{slug}/transcript. Topic pages at ${site_url}/tags/{slug} list everything on a topic. Guest pages at ${site_url}/guest/{name-slug} list a guest's episodes.`,
		'',
		'## Start here',
		'',
		`- [All episodes](${site_url}/shows): every episode, newest first`,
		`- [Guests](${site_url}/guests): everyone who has been on the show`,
		`- [About](${site_url}/about): the hosts and the show`,
		`- [RSS feed](${PODCAST_FEED_URL}): every episode with its audio`,
		'',
		'## Topics',
		'',
		...topics.map(
			(topic) =>
				`- [${link_text(topic.name)}](${site_url}/tags/${topic.slug}): ${topic.count} items`
		),
		'',
		'## Latest episodes',
		'',
		...latest_episodes.map((episode) => episode_line(site_url, episode)),
		'',
		'## Optional',
		'',
		`- [Sitemap](${site_url}/sitemap.xml): every public page, including all episodes and transcripts`,
		''
	].join('\n');
}
