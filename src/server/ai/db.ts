import { generate_ai_notes } from './openai';
import { db } from '$server/db/client';
import {
	aiShowNote as aiShowNotes,
	aiSummaryEntry as aiSummaryEntries,
	aiTweet as aiTweets,
	topic as topics,
	link as links
} from '$server/db/schema';

type Show = { number: number };
type Result = Awaited<ReturnType<typeof generate_ai_notes>>;

export async function save_ai_notes_to_db(result: Result, show: Show) {
	return db.transaction(async (tx) => {
		// Insert the AI show note first
		const [ai_show_note] = await tx
			.insert(aiShowNotes)
			.values({
				show_number: show.number,
				title: result.title,
				description: result.description,
				provider: 'anthropic'
			})
			.$returningId();

		// Insert all related data in parallel
		await Promise.all([
			tx.insert(aiSummaryEntries).values(
				result.summary.map((entry) => ({
					showNote: ai_show_note.id,
					time: entry.time,
					text: entry.text,
					description: entry.description || null
				}))
			),
			tx.insert(aiTweets).values(
				result.tweets.map((tweet) => ({
					showNote: ai_show_note.id,
					content: tweet
				}))
			),
			tx.insert(topics).values(
				result.topics.map((topic) => ({
					showNote: ai_show_note.id,
					name: topic
				}))
			),
			tx.insert(links).values(
				result.links.map((link) => ({
					showNote: ai_show_note.id,
					name: link.name,
					url: link.url,
					timestamp: link.timestamp || null
				}))
			)
		]);

		return ai_show_note;
	});
}
