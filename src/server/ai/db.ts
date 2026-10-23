import type { Prisma } from '@prisma/client';
import type { AiNotes } from './notes';
import { prisma_client } from '#server/prisma-client.js';

type Show = { number: number };

// Length of a plain String column in MySQL, VARCHAR(191)
const VARCHAR_LENGTH = 191;
const DESCRIPTION_LENGTH = 1500;
const TWEET_LENGTH = 350;

const fit = (text: string, length = VARCHAR_LENGTH) =>
	text.length > length ? `${text.slice(0, length - 1)}…` : text;

// Fits the AI output to the columns, so one long string doesn't fail the whole save
export async function save_ai_notes_to_db(
	result: AiNotes,
	show: Show,
	client: Prisma.TransactionClient = prisma_client
) {
	return client.aiShowNote.create({
		data: {
			show: {
				connect: {
					number: show.number
				}
			},
			title: fit(result.title),
			description: fit(result.description, DESCRIPTION_LENGTH),
			summary: {
				create: result.summary.map((entry) => ({
					time: fit(entry.time),
					text: fit(entry.text),
					description: fit(entry.description)
				}))
			},
			tweets: {
				create: result.tweets.map((tweet) => ({ content: fit(tweet, TWEET_LENGTH) }))
			},
			topics: {
				create: result.topics.map((topic) => ({ name: fit(topic) }))
			},
			links: {
				// A shortened URL would be broken, so links that don't fit are left out
				create: result.links
					.filter((link) => link.url.length <= VARCHAR_LENGTH)
					.map((link) => ({
						name: fit(link.name),
						url: link.url,
						timestamp: fit(link.timestamp)
					}))
			},
			provider: 'anthropic'
		}
	});
}

/**
 * Replaces a show's AI notes. In a transaction, so a failed save keeps the old notes.
 */
export async function replace_ai_notes_in_db(result: AiNotes, show: Show) {
	return prisma_client.$transaction(
		async (tx) => {
			await tx.aiShowNote.deleteMany({ where: { show: { number: show.number } } });
			return save_ai_notes_to_db(result, show, tx);
		},
		{ timeout: 20000 }
	);
}
