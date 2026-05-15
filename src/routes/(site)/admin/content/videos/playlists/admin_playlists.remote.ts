import { getRequestEvent, query } from '$app/server';
import { db } from '$server/db/client';
import { error } from '@sveltejs/kit';

function assert_admin_user() {
	const event = getRequestEvent();
	if (!event.locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}
	return event;
}

export const list_playlists = query(async () => {
	assert_admin_user();
	return db.query.playlist.findMany({
		orderBy: (playlist_row, { desc }) => [desc(playlist_row.created_at)],
		with: { videos: { columns: { video_id: true } } }
	});
});
