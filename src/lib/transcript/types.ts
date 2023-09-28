import { Prisma } from '@prisma/client';

export const transcript_with_utterances = Prisma.validator<Prisma.TranscriptDefaultArgs>()({
	include: {
		utterances: {
			include: {
				words: true
			},
			orderBy: {
				start: 'asc'
			}
		}
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

export const SHOW_QUERY = (
	{ take, order, skip }: QueryInputs = { take: PER_PAGE, order: 'desc', skip: 0 }
) =>
	Prisma.validator<Prisma.ShowFindManyArgs>()({
		take,
		orderBy: { number: order },
		skip,
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
