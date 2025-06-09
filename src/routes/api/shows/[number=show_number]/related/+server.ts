import { error, json } from '@sveltejs/kit';
import { findRelatedEpisodes } from '$/server/ai/embeddings.js';

export async function GET({ params, url }) {
	const show_number = parseInt(params.number);
	const limit = parseInt(url.searchParams.get('limit') || '5');
	const threshold = parseFloat(url.searchParams.get('threshold') || '0.7');

	if (!show_number || isNaN(show_number)) {
		error(400, 'Invalid show number');
	}

	try {
		const related_episodes = await findRelatedEpisodes(show_number, limit, threshold);

		const formatted_episodes = related_episodes.map((item) => ({
			number: item.show.number,
			title: item.show.title,
			slug: item.show.slug,
			date: item.show.date,
			show_type: item.show.show_type,
			similarity: Math.round(item.similarity * 100) / 100, // Round to 2 decimal places
			guests: item.show.guests?.map((g) => ({
				name: g.Guest.name,
				of: g.Guest.of
			})) || [],
			topics: item.show.aiShowNote?.topics?.map((t) => t.name) || [],
			url: `/show/${item.show.number}/${item.show.slug}`
		}));

		return json({
			show_number,
			related_episodes: formatted_episodes,
			total: formatted_episodes.length
		}, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
			}
		});
	} catch (err) {
		console.error(`Error getting related episodes for show ${show_number}:`, err);
		
		if (err instanceof Error && err.message.includes('No embedding found')) {
			return json({
				show_number,
				related_episodes: [],
				total: 0,
				message: 'Embedding not yet generated for this episode'
			}, {
				headers: {
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		error(500, 'Failed to get related episodes');
	}
}