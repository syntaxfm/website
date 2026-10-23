import { prisma_client } from '#server/prisma-client.js';
import { MegaphoneApiClient } from './client';

/**
 * Match episodes using various strategies: title matching and episode number
 */
export function matchEpisode(
	showTitle: string,
	showNumber: number,
	showDate: Date,
	episodeTitle: string,
	episodePubdate: string,
	episodeIndex: number,
	totalEpisodes: number
): { match: boolean; strategy?: string; confidence?: number } {
	let best_match = { match: false, strategy: '', confidence: 0 };

	// Strategy 1: Publish date matching (HIGHEST CONFIDENCE)
	const episode_date = new Date(episodePubdate);
	const date_diff_days =
		Math.abs(showDate.getTime() - episode_date.getTime()) / (1000 * 60 * 60 * 24);

	if (date_diff_days <= 1) {
		// Same day or 1 day difference
		// Additional validation: title should have some similarity or episode number should match
		const title_similarity = getTitleSimilarity(showTitle, episodeTitle);
		const episode_number_in_title = extractEpisodeNumber(episodeTitle);

		if (title_similarity > 0.3 || episode_number_in_title === showNumber) {
			const date_confidence = 0.95 - date_diff_days * 0.1; // 0.95 for same day, 0.85 for 1 day diff
			const title_bonus = title_similarity * 0.05;
			const number_bonus = episode_number_in_title === showNumber ? 0.05 : 0;
			return {
				match: true,
				strategy: 'publish_date_match',
				confidence: Math.min(1.0, date_confidence + title_bonus + number_bonus)
			};
		}
	} else if (date_diff_days <= 7) {
		// Within a week
		const title_similarity = getTitleSimilarity(showTitle, episodeTitle);
		const episode_number_in_title = extractEpisodeNumber(episodeTitle);

		if (
			(title_similarity > 0.5 && episode_number_in_title === showNumber) ||
			title_similarity > 0.8
		) {
			const date_confidence = 0.8 - date_diff_days * 0.05; // Decreasing confidence with days
			const title_bonus = title_similarity * 0.1;
			const number_bonus = episode_number_in_title === showNumber ? 0.1 : 0;
			best_match = {
				match: true,
				strategy: 'publish_date_week_match',
				confidence: Math.min(1.0, date_confidence + title_bonus + number_bonus)
			};
		}
	}

	// Strategy 2: Episode number in title (HIGH CONFIDENCE)
	const episode_number_in_title = extractEpisodeNumber(episodeTitle);
	if (episode_number_in_title === showNumber) {
		// Additional validation: title should also have some similarity
		const title_similarity = getTitleSimilarity(showTitle, episodeTitle);
		if (title_similarity > 0.3) {
			// At least 30% similarity
			const number_match = {
				match: true,
				strategy: 'episode_number_in_title',
				confidence: 0.85 + title_similarity * 0.1
			};
			if (number_match.confidence > best_match.confidence) {
				best_match = number_match;
			}
		}
	}

	// Strategy 3: Match by reverse index position (MEDIUM CONFIDENCE)
	// Megaphone API returns episodes in reverse chronological order (newest first)
	// So we need to reverse the index: reverseIndex = totalEpisodes - 1 - episodeIndex
	const reverse_index = totalEpisodes - 1 - episodeIndex;
	if (reverse_index === showNumber) {
		// Additional validation: title should have some similarity
		const title_similarity = getTitleSimilarity(showTitle, episodeTitle);
		if (title_similarity > 0.4) {
			// Require higher similarity for index matching
			const index_match = {
				match: true,
				strategy: 'reverse_index_position',
				confidence: 0.6 + title_similarity * 0.2
			};
			if (index_match.confidence > best_match.confidence) {
				best_match = index_match;
			}
		}
	}

	// Strategy 4: Title matching (LOWER CONFIDENCE)
	if (matchEpisodeTitle(showTitle, episodeTitle)) {
		const title_similarity = getTitleSimilarity(showTitle, episodeTitle);
		if (title_similarity > 0.7) {
			// Require high similarity for title-only matching
			const title_match = {
				match: true,
				strategy: 'title_match',
				confidence: title_similarity * 0.6
			};
			if (title_match.confidence > best_match.confidence) {
				best_match = title_match;
			}
		}
	}

	// Only return a match if confidence is above threshold
	if (best_match.confidence > 0.5) {
		return best_match;
	}

	return { match: false };
}

function findBestEpisodeMatch(
	show: { title: string; number: number; date: Date },
	episodes: any[]
): {
	matchingEpisode: any;
	matchResult: { match: boolean; strategy?: string; confidence?: number };
} {
	let best_match: {
		episode: any;
		result: { match: boolean; strategy?: string; confidence?: number };
	} | null = null;

	for (let index = 0; index < episodes.length; index++) {
		const episode = episodes[index];
		const match_result = matchEpisode(
			show.title,
			show.number,
			show.date,
			episode.title,
			episode.pubdate,
			index,
			episodes.length
		);

		if (
			match_result.match &&
			(!best_match || match_result.confidence! > best_match.result.confidence!)
		) {
			best_match = { episode, result: match_result };
		}
	}

	return {
		matchingEpisode: best_match?.episode,
		matchResult: best_match?.result || { match: false }
	};
}

async function updateShowSpotifyId(
	showNumber: number,
	spotifyId: string,
	matchResult: any
): Promise<boolean> {
	const existing_show = await prisma_client.show.findFirst({
		where: {
			spotify_id: spotifyId,
			number: { not: showNumber }
		},
		select: { number: true, title: true }
	});

	if (existing_show) {
		console.warn(
			`⚠️  Spotify ID ${spotifyId} is already used by show ${existing_show.number}: "${existing_show.title}". Skipping assignment for show ${showNumber}.`
		);
		console.warn(
			`   Match details: strategy="${matchResult?.strategy}", confidence=${matchResult?.confidence?.toFixed(3)}`
		);
		return false;
	}

	await prisma_client.show.update({
		where: { number: showNumber },
		data: {
			spotify_id: spotifyId
		}
	});
	return true;
}

/**
 * Calculate similarity between two titles (0-1 scale)
 */
function getTitleSimilarity(title1: string, title2: string): number {
	const normalize = (title: string) => {
		return title
			.toLowerCase()
			.trim()
			.replace(/[^\w\s]/g, '') // Remove special characters
			.replace(/\s+/g, ' ') // Normalize whitespace
			.replace(/\d+/g, '') // Remove numbers for comparison
			.trim();
	};

	const normalized_title1 = normalize(title1);
	const normalized_title2 = normalize(title2);

	if (normalized_title1 === normalized_title2) {
		return 1.0;
	}

	// Calculate word overlap
	const words1 = normalized_title1.split(' ').filter((word) => word.length > 2);
	const words2 = normalized_title2.split(' ').filter((word) => word.length > 2);

	if (words1.length === 0 || words2.length === 0) {
		return 0;
	}

	const intersection = words1.filter((word) => words2.includes(word));
	const union = [...new Set([...words1, ...words2])];

	return intersection.length / union.length;
}

/**
 * Extract episode number from title (e.g., "Episode 123 - Title" -> 123)
 */
export function extractEpisodeNumber(title: string): number | null {
	// Look for patterns like "Episode 123", "Ep 123", "123 -", etc.
	const patterns = [/episode\s*(\d+)/i, /ep\s*(\d+)/i, /^(\d+)\s*[-–—]/, /#(\d+)/, /\b(\d+)\b/];

	for (const pattern of patterns) {
		const match = title.match(pattern);
		if (match) {
			const num = parseInt(match[1]);
			if (!isNaN(num) && num > 0) {
				return num;
			}
		}
	}

	return null;
}

/**
 * Match episode titles using various strategies
 */
export function matchEpisodeTitle(showTitle: string, episodeTitle: string): boolean {
	// Clean both titles for comparison
	const normalize_title = (title: string) => {
		return title
			.toLowerCase()
			.trim()
			.replace(/[^\w\s]/g, '') // Remove special characters
			.replace(/\s+/g, ' '); // Normalize whitespace
	};

	const normalized_show_title = normalize_title(showTitle);
	const normalized_episode_title = normalize_title(episodeTitle);

	// Try exact match first
	if (normalized_show_title === normalized_episode_title) {
		return true;
	}

	// Try partial match (episode title contains show title or vice versa)
	if (
		normalized_show_title.includes(normalized_episode_title) ||
		normalized_episode_title.includes(normalized_show_title)
	) {
		return true;
	}

	// Try matching without numbers (for cases like "Episode 123 - Title" vs "Title")
	const remove_numbers = (title: string) => title.replace(/\d+/g, '').trim();
	const show_title_no_numbers = remove_numbers(normalized_show_title);
	const episode_title_no_numbers = remove_numbers(normalized_episode_title);

	if (show_title_no_numbers && episode_title_no_numbers) {
		if (show_title_no_numbers === episode_title_no_numbers) {
			return true;
		}
		if (
			show_title_no_numbers.includes(episode_title_no_numbers) ||
			episode_title_no_numbers.includes(show_title_no_numbers)
		) {
			return true;
		}
	}

	return false;
}

export interface MegaphoneCredentials {
	apiToken: string;
	networkId: string;
	podcastId: string;
}

/**
 * Sync Spotify data for a specific episode by matching title
 */
export async function syncEpisodeSpotifyData(
	showNumber: number,
	credentials: MegaphoneCredentials
): Promise<void> {
	// Get the show from database
	const show = await prisma_client.show.findUnique({
		where: { number: showNumber },
		select: {
			number: true,
			title: true,
			date: true,
			spotify_id: true
		}
	});

	if (!show) {
		throw new Error(`Show ${showNumber} not found`);
	}

	// Skip if we already have Spotify data
	if (show.spotify_id) {
		return;
	}

	// Get all episodes from Megaphone API
	const megaphone_client = new MegaphoneApiClient(credentials.apiToken);
	const episodes = await megaphone_client.getAllEpisodes(
		credentials.networkId,
		credentials.podcastId
	);

	const { matchingEpisode: matching_episode, matchResult: match_result } = findBestEpisodeMatch(
		show,
		episodes
	);

	if (matching_episode?.spotifyIdentifier) {
		await updateShowSpotifyId(showNumber, matching_episode.spotifyIdentifier, match_result);
	}
}

/**
 * Check for and report duplicate Spotify IDs in the database
 */
export async function checkDuplicateSpotifyIds(): Promise<
	Array<{ spotifyId: string; shows: Array<{ number: number; title: string }> }>
> {
	const duplicates = await prisma_client.$queryRaw<Array<{ spotify_id: string; count: number }>>`
		SELECT spotify_id, COUNT(*) as count
		FROM \`Show\`
		WHERE spotify_id IS NOT NULL
		GROUP BY spotify_id
		HAVING count > 1
	`;

	const duplicate_details = [];
	for (const duplicate of duplicates) {
		const shows = await prisma_client.show.findMany({
			where: { spotify_id: duplicate.spotify_id },
			select: { number: true, title: true }
		});

		duplicate_details.push({
			spotifyId: duplicate.spotify_id,
			shows: shows
		});
	}

	return duplicate_details;
}

/**
 * Sync Spotify data for all episodes that don't have it
 */
export async function syncAllEpisodesSpotifyData(credentials: MegaphoneCredentials): Promise<void> {
	// Get all shows without Spotify data
	const shows_without_spotify = await prisma_client.show.findMany({
		where: {
			spotify_id: null
		},
		select: {
			number: true,
			title: true,
			date: true
		},
		orderBy: {
			number: 'desc'
		}
	});

	// Get all episodes from Megaphone API once
	const megaphone_client = new MegaphoneApiClient(credentials.apiToken);
	const megaphone_episodes = await megaphone_client.getAllEpisodes(
		credentials.networkId,
		credentials.podcastId
	);

	// Process each show
	for (const show of shows_without_spotify) {
		try {
			const { matchingEpisode: matching_episode, matchResult: match_result } = findBestEpisodeMatch(
				show,
				megaphone_episodes
			);

			if (matching_episode?.spotifyIdentifier) {
				const updated = await updateShowSpotifyId(
					show.number,
					matching_episode.spotifyIdentifier,
					match_result
				);
				if (!updated) {
					continue;
				}
			}

			// Small delay to be respectful to the database
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			console.error(`Error processing show ${show.number}:`, error);
		}
	}
}
