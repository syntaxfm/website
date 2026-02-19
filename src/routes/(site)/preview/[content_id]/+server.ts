import { dev } from '$app/environment';
import { db } from '$server/db/client';
import { content } from '$server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, locals, params }) => {
	if (!locals?.user?.roles?.includes('admin')) {
		error(403, 'Admin access required');
	}

	const content_item = await db.query.content.findFirst({
		where: eq(content.id, params.content_id),
		with: {
			show: true,
			video: true,
			article: true
		}
	});

	if (!content_item) {
		error(404, 'Content not found');
	}

	cookies.set('preview_content_id', content_item.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 15
	});

	if (content_item.show) {
		redirect(302, `/show/${content_item.show.number}/${content_item.show.slug}?preview=1`);
	}

	if (content_item.video) {
		redirect(302, content_item.video.url);
	}

	redirect(302, `/admin/articles/${content_item.id}?preview=1`);
};
