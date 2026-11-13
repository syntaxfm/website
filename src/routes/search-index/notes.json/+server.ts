import { json } from '@sveltejs/kit';
import { load_search_notes, SEARCH_INDEX_HEADERS } from '../search_index.server';

export async function GET() {
	return json(await load_search_notes(), { headers: SEARCH_INDEX_HEADERS });
}
