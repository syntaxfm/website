import { PER_PAGE } from '$const';
import { $Enums, Prisma } from '@prisma/client';

export const transcript_with_utterances = Prisma.validator<Prisma.TranscriptDefaultArgs>()({
	include: {
		utterances: {
			include: {
				words: false // Way too big for client side
			},
			orderBy: {
				start: 'asc'
			}
		}
	}
});

export const transcript_without_ai_notes_query = Prisma.validator<Prisma.ShowFindFirstArgs>()({
	where: {
		// Where there is no AI Show Note, and there is a transcript
		aiShowNote: null,
		transcript: {
			isNot: null
		}
	},
	include: {
		transcript: transcript_with_utterances
	},
	orderBy: {
		number: 'desc'
	}
});

export const ai_note_with_friends = Prisma.validator<Prisma.AiShowNoteDefaultArgs>()({
	include: {
		links: true,
		summary: true,
		topics: true,
		tweets: true
	}
});

export type TranscriptWithUtterances = Prisma.TranscriptGetPayload<
	typeof transcript_with_utterances
>;
export type AINoteWithFriends = Prisma.AiShowNoteGetPayload<typeof ai_note_with_friends>;

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
	show_type?: $Enums.ShowType;
};

export const SHOW_QUERY = (
	{ take, order, skip, show_type }: QueryInputs = { take: PER_PAGE, order: 'desc', skip: 0 }
) => {
	const today = new Date();

	return Prisma.validator<Prisma.ShowFindManyArgs>()({
		take,
		orderBy: { number: order },
		skip,
		where: {
			...(show_type && { show_type: show_type }),
			date: {
				lte: today
			}
		},
		include: {
			guests: {
				select: {
					Guest: {
						select: {
							github: true,
							name: true
						}
					}
				}
			},
			aiShowNote: {
				select: {
					description: true,
					topics: true
				}
			}
		}
	});
};

export type LatestShow = Prisma.ShowGetPayload<ReturnType<typeof SHOW_QUERY>>;
