import z from 'zod';
import type { SyntaxMCP } from '../index.js';
import { prisma_client } from '$/server/prisma-client.js';
import { transcript_to_string } from '../utils.js';

export function setup_tools(server: SyntaxMCP) {
	server.tool(
		{
			name: 'list_episodes',
			description: 'Get a list of all the episodes with relative show notes',
			schema: z.object({
				query: z
					.string()
					.describe(
						'A comma separated list of keywords to search for in the title or the notes for the shows'
					)
					.optional(),
				year_cutoff: z
					.number()
					.optional()
					.describe(
						'Only shows published after this year (YYYY) will be returned, will default to current year but better to ask the user for a specific range if possible'
					)
			}),
			outputSchema: z.object({
				shows: z.array(
					z.object({
						show_notes: z.string(),
						title: z.string(),
						number: z.number()
					})
				)
			})
		},
		async ({ query = '', year_cutoff }) => {
			const year = new Date();
			if (year_cutoff) {
				year.setFullYear(year_cutoff);
			}
			year.setMonth(0, 1);

			const shows = await prisma_client.show.findMany({
				select: {
					number: true,
					show_notes: true,
					title: true
				},
				where: {
					AND: [
						{ date: { gte: year } },
						{
							OR: query.split(',').flatMap((query_part) => [
								{
									title: {
										contains: query_part.trim()
									}
								},
								{
									show_notes: {
										contains: query_part.trim()
									}
								}
							])
						}
					]
				},
				orderBy: {
					number: 'desc'
				}
			});
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({ shows })
					}
				],
				structuredContent: {
					shows
				}
			};
		}
	);

	server.tool(
		{
			name: 'get_episode',
			description: 'Get information about a specific episode by its number',
			schema: z.object({
				show_number: z
					.number()
					.describe('The number of the episode to get information about (e.g. 500 for episode 500)')
			})
		},
		async ({ show_number }) => {
			const show = await prisma_client.show.findFirst({
				select: {
					number: true,
					show_notes: true,
					title: true,
					youtube_url: true,
					date: true,
					guests: true,
					show_type: true,
					url: true,
					videos: true,
					transcript: {
						select: {
							utterances: true
						}
					}
				},
				where: {
					number: {
						equals: show_number
					}
				}
			});

			if (!show) {
				return {
					isError: true,
					content: [
						{
							type: 'text',
							text: `No show found with number ${show_number}`
						}
					]
				};
			}

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({
							show: {
								...show,
								transcript: show.transcript ? transcript_to_string(show.transcript) : ''
							}
						})
					}
				]
			};
		}
	);

	server.tool(
		{
			name: 'get_transcript',
			description: 'Get the transcript for a specific show number',
			schema: z.object({
				show_number: z
					.number()
					.describe('The number of the episode to get transcript of (e.g. 500 for episode 500)')
			})
		},
		async ({ show_number }) => {
			const transcript = await prisma_client.transcript.findFirst({
				select: {
					utterances: true
				},
				where: {
					show_number: {
						equals: show_number
					}
				}
			});

			if (!transcript) {
				return {
					isError: true,
					content: [
						{
							type: 'text',
							text: `No transcript found with number ${show_number}`
						}
					]
				};
			}

			const text = transcript_to_string(transcript);

			return {
				content: [
					{
						type: 'text',
						text
					}
				]
			};
		}
	);
}
