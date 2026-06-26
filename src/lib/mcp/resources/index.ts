import { prisma_client } from '$/server/prisma-client.js';
import type { SyntaxMCP } from '../index.js';
import { transcript_to_string } from '../utils.js';
import { icons } from '../icons/index.js';

export function setup_resources(server: SyntaxMCP) {
	server.template(
		{
			uri: 'syntaxfm://show/{slug}.json',
			description: 'Get all info about a specific show given its slug',
			name: 'show_info',
			title: 'Show Info',
			icons,
			async list() {
				const slugs = await prisma_client.show.findMany({
					select: {
						slug: true,
						title: true
					},
					orderBy: {
						date: 'desc'
					}
				});
				return slugs.map((s) => ({
					name: `${s.title}.json`,
					value: s.slug,
					uri: `syntaxfm://show/${s.slug}.json`,
					title: `${s.title}.json`
				}));
			},
			complete: {
				async slug(query) {
					const slugs = await prisma_client.show.findMany({
						select: {
							slug: true
						},
						where: {
							slug: {
								contains: query.toString()
							}
						},
						take: 50
					});

					return {
						completion: {
							values: slugs.map((s) => s.slug)
						}
					};
				}
			}
		},
		async (uri, { slug }) => {
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
					slug: {
						equals: slug.toString()
					}
				}
			});

			if (!show) throw new Error(`No show found with slug ${slug}`);

			return {
				contents: [
					{
						uri,
						mimeType: 'application/json',
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
}
