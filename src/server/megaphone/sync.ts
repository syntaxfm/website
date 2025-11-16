import { db } from '$server/db/client';
import { show } from '$server/db/schema';
import { eq, ne, isNull, desc, and, sql } from 'drizzle-orm';
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
	let bestMatch = { match: false, strategy: '', confidence: 0 };

	// Strategy 1: Publish date matching (HIGHEST CONFIDENCE)
	const episodeDate = new Date(episodePubdate);
	const dateDiffDays = Math.abs(showDate.getTime() - episodeDate.getTime()) / (1000 * 60 * 60 * 24);

	if (dateDiffDays <= 1) {
		// Same day or 1 day difference
		// Additional validation: title should have some similarity or episode number should match
		const titleSimilarity = getTitleSimilarity(showTitle, episodeTitle);
		const episodeNumberInTitle = extractEpisodeNumber(episodeTitle);

		if (titleSimilarity > 0.3 || episodeNumberInTitle === showNumber) {
			const dateConfidence = 0.95 - dateDiffDays * 0.1; // 0.95 for same day, 0.85 for 1 day diff
			const titleBonus = titleSimilarity * 0.05;
			const numberBonus = episodeNumberInTitle === showNumber ? 0.05 : 0;
			return {
				match: true,
				strategy: 'publish_date_match',
				confidence: Math.min(1.0, dateConfidence + titleBonus + numberBonus)
			};
		}
	} else if (dateDiffDays <= 7) {
		// Within a week
		const titleSimilarity = getTitleSimilarity(showTitle, episodeTitle);
		const episodeNumberInTitle = extractEpisodeNumber(episodeTitle);

		if ((titleSimilarity > 0.5 && episodeNumberInTitle === showNumber) || titleSimilarity > 0.8) {
			const dateConfidence = 0.8 - dateDiffDays * 0.05; // Decreasing confidence with days
			const titleBonus = titleSimilarity * 0.1;
			const numberBonus = episodeNumberInTitle === showNumber ? 0.1 : 0;
			bestMatch = {
				match: true,
				strategy: 'publish_date_week_match',
				confidence: Math.min(1.0, dateConfidence + titleBonus + numberBonus)
			};
		}
	}

	// Strategy 2: Episode number in title (HIGH CONFIDENCE)
	const episodeNumberInTitle = extractEpisodeNumber(episodeTitle);
	if (episodeNumberInTitle === showNumber) {
		// Additional validation: title should also have some similarity
		const titleSimilarity = getTitleSimilarity(showTitle, episodeTitle);
		if (titleSimilarity > 0.3) {
			// At least 30% similarity
			const numberMatch = {
				match: true,
				strategy: 'episode_number_in_title',
				confidence: 0.85 + titleSimilarity * 0.1
			};
			if (numberMatch.confidence > bestMatch.confidence) {
				bestMatch = numberMatch;
			}
		}
	}

	// Strategy 3: Match by reverse index position (MEDIUM CONFIDENCE)
	// Megaphone API returns episodes in reverse chronological order (newest first)
	// So we need to reverse the index: reverseIndex = totalEpisodes - 1 - episodeIndex
	const reverseIndex = totalEpisodes - 1 - episodeIndex;
	if (reverseIndex === showNumber) {
		// Additional validation: title should have some similarity
		const titleSimilarity = getTitleSimilarity(showTitle, episodeTitle);
		if (titleSimilarity > 0.4) {
			// Require higher similarity for index matching
			const indexMatch = {
				match: true,
				strategy: 'reverse_index_position',
				confidence: 0.6 + titleSimilarity * 0.2
			};
			if (indexMatch.confidence > bestMatch.confidence) {
				bestMatch = indexMatch;
			}
		}
	}

	// Strategy 4: Title matching (LOWER CONFIDENCE)
	if (matchEpisodeTitle(showTitle, episodeTitle)) {
		const titleSimilarity = getTitleSimilarity(showTitle, episodeTitle);
		if (titleSimilarity > 0.7) {
			// Require high similarity for title-only matching
			const titleMatch = {
				match: true,
				strategy: 'title_match',
				confidence: titleSimilarity * 0.6
			};
			if (titleMatch.confidence > bestMatch.confidence) {
				bestMatch = titleMatch;
			}
		}
	}

	// Only return a match if confidence is above threshold
	if (bestMatch.confidence > 0.5) {
		return bestMatch;
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
	let bestMatch: {
		episode: any;
		result: { match: boolean; strategy?: string; confidence?: number };
	} | null = null;

	for (let index = 0; index < episodes.length; index++) {
		const episode = episodes[index];
		const matchResult = matchEpisode(
			show.title,
			show.number,
			show.date,
			episode.title,
			episode.pubdate,
			index,
			episodes.length
		);

		if (
			matchResult.match &&
			(!bestMatch || matchResult.confidence! > bestMatch.result.confidence!)
		) {
			bestMatch = { episode, result: matchResult };
		}
	}

	return {
		matchingEpisode: bestMatch?.episode,
		matchResult: bestMatch?.result || { match: false }
	};
}

async function updateShowSpotifyId(
	showNumber: number,
	spotifyId: string,
	matchResult: any
): Promise<boolean> {
	const existingShow = await db.query.show.findFirst({
		where: and(eq(show.spotify_id, spotifyId), ne(show.number, showNumber)),
		columns: {
			number: true,
			title: true
		}
	});

	if (existingShow) {
		console.warn(
			`⚠️  Spotify ID ${spotifyId} is already used by show ${existingShow.number}: "${existingShow.title}". Skipping assignment for show ${showNumber}.`
		);
		console.warn(
			`   Match details: strategy="${matchResult?.strategy}", confidence=${matchResult?.confidence?.toFixed(3)}`
		);
		return false;
	}

	await db
		.update(show)
		.set({
			spotify_id: spotifyId,
			updated_at: new Date()
		})
		.where(eq(show.number, showNumber));

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

	const normalizedTitle1 = normalize(title1);
	const normalizedTitle2 = normalize(title2);

	if (normalizedTitle1 === normalizedTitle2) {
		return 1.0;
	}

	// Calculate word overlap
	const words1 = normalizedTitle1.split(' ').filter((word) => word.length > 2);
	const words2 = normalizedTitle2.split(' ').filter((word) => word.length > 2);

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
	const normalizeTitle = (title: string) => {
		return title
			.toLowerCase()
			.trim()
			.replace(/[^\w\s]/g, '') // Remove special characters
			.replace(/\s+/g, ' '); // Normalize whitespace
	};

	const normalizedShowTitle = normalizeTitle(showTitle);
	const normalizedEpisodeTitle = normalizeTitle(episodeTitle);

	// Try exact match first
	if (normalizedShowTitle === normalizedEpisodeTitle) {
		return true;
	}

	// Try partial match (episode title contains show title or vice versa)
	if (
		normalizedShowTitle.includes(normalizedEpisodeTitle) ||
		normalizedEpisodeTitle.includes(normalizedShowTitle)
	) {
		return true;
	}

	// Try matching without numbers (for cases like "Episode 123 - Title" vs "Title")
	const removeNumbers = (title: string) => title.replace(/\d+/g, '').trim();
	const showTitleNoNumbers = removeNumbers(normalizedShowTitle);
	const episodeTitleNoNumbers = removeNumbers(normalizedEpisodeTitle);

	if (showTitleNoNumbers && episodeTitleNoNumbers) {
		if (showTitleNoNumbers === episodeTitleNoNumbers) {
			return true;
		}
		if (
			showTitleNoNumbers.includes(episodeTitleNoNumbers) ||
			episodeTitleNoNumbers.includes(showTitleNoNumbers)
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
	const current_show = await db.query.show.findFirst({
		where: eq(show.number, showNumber),
		columns: {
			number: true,
			title: true,
			date: true,
			spotify_id: true
		}
	});

	if (!current_show) {
		throw new Error(`Show ${showNumber} not found`);
	}

	// Skip if we already have Spotify data
	if (current_show.spotify_id) {
		return;
	}

	// Get all episodes from Megaphone API
	const megaphoneClient = new MegaphoneApiClient(credentials.apiToken);
	const episodes = await megaphoneClient.getAllEpisodes(
		credentials.networkId,
		credentials.podcastId
	);

	const { matchingEpisode, matchResult } = findBestEpisodeMatch(current_show, episodes);

	if (matchingEpisode?.spotifyIdentifier) {
		await updateShowSpotifyId(showNumber, matchingEpisode.spotifyIdentifier, matchResult);
	}
}

/**
 * Check for and report duplicate Spotify IDs in the database
 */
export async function checkDuplicateSpotifyIds(): Promise<
	Array<{ spotifyId: string; shows: Array<{ number: number; title: string }> }>
> {
	const duplicates = await db.execute<{ spotify_id: string; count: number }>(sql`
		SELECT spotify_id, COUNT(*) as count
		FROM \`Show\`
		WHERE spotify_id IS NOT NULL
		GROUP BY spotify_id
		HAVING count > 1
	`);

	const duplicateDetails = [];
	for (const duplicate of duplicates.rows) {
		const showsData = await db.query.show.findMany({
			where: eq(show.spotify_id, duplicate.spotify_id),
			columns: {
				number: true,
				title: true
			}
		});

		duplicateDetails.push({
			spotifyId: duplicate.spotify_id,
			shows: showsData
		});
	}

	return duplicateDetails;
}

/**
 * Sync Spotify data for all episodes that don't have it
 */
export async function syncAllEpisodesSpotifyData(credentials: MegaphoneCredentials): Promise<void> {
	// Get all shows without Spotify data
	const showsWithoutSpotify = await db.query.show.findMany({
		where: isNull(show.spotify_id),
		columns: {
			number: true,
			title: true,
			date: true
		},
		orderBy: [desc(show.number)]
	});

	// Get all episodes from Megaphone API once
	const megaphoneClient = new MegaphoneApiClient(credentials.apiToken);
	const megaphoneEpisodes = await megaphoneClient.getAllEpisodes(
		credentials.networkId,
		credentials.podcastId
	);

	// Process each show
	for (const show of showsWithoutSpotify) {
		try {
			const { matchingEpisode, matchResult } = findBestEpisodeMatch(show, megaphoneEpisodes);

			if (matchingEpisode?.spotifyIdentifier) {
				const updated = await updateShowSpotifyId(
					show.number,
					matchingEpisode.spotifyIdentifier,
					matchResult
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
