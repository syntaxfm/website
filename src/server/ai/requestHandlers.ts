import { error, type RequestEvent } from '@sveltejs/kit';
import { ai_note_with_transcript, transcript_with_utterances } from './queries';
import { generate_ai_notes } from './openai';

export async function aiNoteRequestHandler({ request, locals }: RequestEvent) {
	const data = await request.formData();
	const show_number = parseInt(data.get('show_number')?.toString() || '');

	if (!show_number) {
		throw error(400, 'Invalid Show Number');
	}

	const show = await locals.prisma.show.findUnique({
		where: { number: show_number },
		include: {
			transcript: transcript_with_utterances
		}
	});

	if (!show?.transcript) {
		throw error(400, 'No show, or no transcript for this show');
	}
	// delete any existing ai notes
	await locals.prisma.aiShowNote.deleteMany({
		where: {
			show: {
				number: show_number
			}
		}
	});

	// Get the AI transcript for this show
	const result = await generate_ai_notes(show);
	// Save to DB
	console.log(`🤖 Saving AI Notes to DB for Show ${show_number}`);
	console.dir(result);
	const dbResponse = await locals.prisma.aiShowNote.create({
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
					url: link.url
				}))
			}
		}
	});

	return { message: 'AI Notes Created' };
}
