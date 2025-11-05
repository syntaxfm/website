import { PER_PAGE } from '$const';
import { desc, asc, lte, and, eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import {
	shows,
	transcripts,
	transcriptUtterances,
	aiShowNotes,
	aiSummaryEntries,
	links,
	topics,
	aiTweets
} from '$server/db/schema';

// Query for finding show without AI notes but with transcript
// In Drizzle relational queries, we can filter based on relations being null/not null
export const transcript_without_ai_notes_query = () => ({
	with: {
		transcript: {
			with: {
				utterances: {
					columns: {
						id: true,
						start: true,
						end: true,
						confidence: true,
						channel: true,
						transcript_value: true,
						speaker: true,
						speakerName: true,
						transcriptId: true
					},
					orderBy: [asc(transcriptUtterances.start)]
				}
			}
		},
		aiShowNote: {}
	},
	orderBy: [desc(shows.number)]
});

// AI note with all related data
export const ai_note_with_friends = () => ({
	with: {
		links: true,
		summary: true,
		topics: true,
		tweets: true
	}
});

export type TranscriptWithUtterances = InferSelectModel<typeof transcripts> & {
	utterances: InferSelectModel<typeof transcriptUtterances>[];
};

export type AINoteWithFriends = InferSelectModel<typeof aiShowNotes> & {
	links: InferSelectModel<typeof links>[];
	summary: InferSelectModel<typeof aiSummaryEntries>[];
	topics: InferSelectModel<typeof topics>[];
	tweets: InferSelectModel<typeof aiTweets>[];
};

type SummaryItem = {
	time: string;
	text: string;
	description: string;
};

type Link = {
	name: string;
	url: string;
	timestamp: string;
};

type SpeakerTime = {
	name: string;
	time: string;
};

export type AIPodcastSummaryResponse = {
	title: string;
	description: string;
	notes: string;
	summary: SummaryItem[];
	tweets: string[];
	listener_tweets: string[];
	topics: string[];
	links: Link[];
	speaker_times: SpeakerTime[];
	guests: string[];
};

export type QueryInputs = {
	take?: number;
	order?: 'asc' | 'desc';
	skip?: number;
	show_type?: 'HASTY' | 'TASTY' | 'SUPPER' | 'SPECIAL';
};

export const SHOW_QUERY = (
	{ take, order, skip, show_type }: QueryInputs = { take: PER_PAGE, order: 'desc', skip: 0 }
) => {
	const today = new Date();

	return {
		limit: take,
		offset: skip,
		orderBy: order === 'desc' ? [desc(shows.number)] : [asc(shows.number)],
		where: show_type
			? and(eq(shows.show_type, show_type), lte(shows.date, today))
			: lte(shows.date, today),
		with: {
			guests: {
				with: {
					guest: {
						columns: {
							github: true,
							name: true
						}
					}
				}
			},
			hosts: {
				with: {
					user: {
						columns: {
							id: true,
							username: true,
							name: true,
							twitter: true
						}
					}
				}
			},
			aiShowNote: {
				columns: {
					description: true
				},
				with: {
					topics: true
				}
			}
		}
	};
};

export type LatestShow = InferSelectModel<typeof shows> & {
	guests: Array<{
		guest: {
			github: string | null;
			name: string;
		};
	}>;
	hosts: Array<{
		user: {
			id: string;
			username: string | null;
			name: string | null;
			twitter: string | null;
		};
	}>;
	aiShowNote: {
		description: string;
		topics: InferSelectModel<typeof topics>[];
	} | null;
};
