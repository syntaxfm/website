import type { AiNotes } from './notes';
import { prisma_client } from '#server/prisma-client.js';

type Show = { number: number };

export async function save_ai_notes_to_db(result: AiNotes, show: Show) {
	return prisma_client.aiShowNote.create({
		data: {
			show: {
				connect: {
					number: show.number
				}
			},
			title: result.title,
			description: result.description,
			summary: {
				create: result.summary
			},
			tweets: {
				create: result.tweets.map((tweet) => ({ content: tweet }))
			},
			topics: {
				create: result.topics.map((topic) => ({ name: topic }))
			},
			links: {
				create: result.links.map((link) => ({
					name: link.name,
					url: link.url,
					timestamp: link.timestamp
				}))
			},
			provider: 'anthropic'
		}
	});
}
