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

// Example of the response from the OPenAI API
export const example_response = {
	title: 'WTF Are Signals And Why Is Everyone So Hot On Them All Of The Sudden?',
	description:
		'In this episode, Scott and Wes discuss the concept of signals in web development and why they are gaining popularity. They explain what signals are, how they are similar to other concepts like event listeners and reactive variables, and how they can be implemented in different frameworks. They also touch on the benefits and use cases of using signals in web development projects.',
	notes:
		'The podcast episode covers the concept of signals in web development, their similarities to event listeners and reactive variables, their implementation in different frameworks, and their benefits and use cases.',
	summary: [
		{
			time: '00:03',
			text: 'Introduction to the topic of signals in web development'
		},
		{
			time: '01:14',
			text: 'Guest shares examples of using signals in web development projects'
		},
		{
			time: '02:44',
			text: 'Discussion on the various implementations of signals in different frameworks'
		},
		{
			time: '04:22',
			text: 'The similarities between signals and event listeners'
		},
		{
			time: '05:43',
			text: 'Signals as a concept and its relation to reactive variables'
		},
		{
			time: '06:25',
			text: 'Exploring the boundaries and use cases of signals'
		},
		{ time: '07:55', text: 'Signals in the context of React' },
		{
			time: '09:58',
			text: 'The benefits of using signals in web development projects'
		},
		{ time: '11:20', text: 'Signals in Angular and other frameworks' },
		{
			time: '13:06',
			text: 'The simplicity and power of using signals in vanilla JavaScript'
		},
		{
			time: '15:30',
			text: 'Signals as a messaging system between different parts of an app'
		},
		{
			time: '17:21',
			text: 'The availability and adoption of signals in different frameworks'
		},
		{ time: '18:52', text: 'Conclusion and sign-off' }
	],
	tweets: [
		"🚨 New episode alert! 🚨 @syntaxfm discusses the concept of signals in web development and why they're gaining popularity. Tune in to learn more about this exciting and trending topic! #webdevelopment #signals",
		'Curious about signals in web development? @syntaxfm has got you covered! Join @wesbos and @stolinski as they dive into the world of signals and their growing importance in modern web development. #webdev #coding',
		'Signals, signals everywhere! 🚦📢@syntaxfm explores the fascinating world of signals in web development. Get ready to learn how signals can enhance your projects and make your code more reactive. #webdevelopment #signals',
		"🔊 Listen up! @syntaxfm is back with another incredible episode. This time, they're demystifying signals in web development. Don't miss out on this valuable discussion! #webdev #programming",
		"Ready to level up your web development skills? Tune into this episode of @syntaxfm where they break down signals and why they're all the rage in the industry right now. #webdevelopment #signals",
		'Looking for a new web development concept to dive into? Look no further! @syntaxfm has got you covered with their latest episode on signals. Join the conversation and learn something new. #webdev #coding'
	],
	listener_tweets: [
		'This is a fantastic episode about the concept of signals in web development. I really enjoyed the part where @wesbos talked about the similarities between signals and event listeners. #webdevelopment #signals @syntaxfm',
		'Finally got around to listening to this episode of @syntaxfm about signals in web development. Really interesting stuff! I never realized how powerful and versatile signals can be. Great job, guys! #webdev #coding',
		"Just finished listening to this fascinating episode of @syntaxfm on signals in web development. It's amazing how signals can simplify event-driven state management. Highly recommend giving it a listen! #webdevelopment #signals",
		'Another awesome episode from @syntaxfm! I loved learning about the different implementations of signals in frameworks like React and Angular. The possibilities with signals are endless. #webdev #programming @wesbos @stolinski',
		"Thanks, @syntaxfm, for explaining signals in such a clear and concise way. I finally understand how they work and why they're gaining popularity. Can't wait to try incorporating signals into my next project! #webdevelopment #signals",
		'Signal me up for more episodes like this! @syntaxfm always delivers valuable content. This episode on signals in web development was no exception. Keep up the great work, guys! #webdev #coding'
	],
	topics: [
		'Signals',
		'Event Listeners',
		'Reactive Variables',
		'Implementation in Different Frameworks',
		'Benefits and Use Cases'
	],
	links: [],
	guests: ['Guest 2']
};
