// Topic pages (/tags/[tag]) and guest pages (/guest/[name_slug]): their search descriptions and the
// transcript moments a topic page links to.

export type KeyMomentRow = {
	show_number: number;
	show_slug: string;
	show_title: string;
	time: string;
	text: string;
};

// A Postgres regex (case-insensitive with ~*) matching the name as a whole word, so the "CSS" topic
// matches "CSS Grid" but not "CSSWG", and "C++" works despite its regex characters
export function whole_word_pattern(name: string): string {
	const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return `(^|[^[:alnum:]_])${escaped}([^[:alnum:]_]|$)`;
}

// Rows arrive newest episode first. One moment per episode, so the list spans episodes.
export function pick_key_moments(rows: readonly KeyMomentRow[], limit: number): KeyMomentRow[] {
	const seen = new Set<number>();
	const picked: KeyMomentRow[] = [];
	for (const row of rows) {
		if (picked.length === limit) break;
		if (seen.has(row.show_number)) continue;
		seen.add(row.show_number);
		picked.push(row);
	}
	return picked;
}

function count_label(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

export function topic_description(
	name: string,
	counts: { episodes: number; videos: number },
	latest_title: string | null
): string {
	const parts = [
		counts.episodes > 0 && count_label(counts.episodes, 'episode', 'episodes'),
		counts.videos > 0 && count_label(counts.videos, 'video', 'videos')
	].filter(Boolean);
	const what = parts.length > 0 ? parts.join(' and ') : 'Nothing yet';
	const latest = latest_title ? ` Latest: ${latest_title}.` : '';
	return `${what} about ${name} from Syntax, the web development podcast with Wes Bos and Scott Tolinski.${latest}`;
}

export function guest_description(
	guest: { name: string; of: string | null },
	episode_titles: readonly string[]
): string {
	const who = guest.of ? `${guest.name} (${guest.of})` : guest.name;
	if (episode_titles.length === 0) return `${who} on Syntax, the web development podcast.`;
	const count = count_label(episode_titles.length, 'episode', 'episodes');
	return `${who} on Syntax, the web development podcast: ${count}, including "${episode_titles[0]}".`;
}
