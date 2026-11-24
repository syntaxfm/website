import type { Path } from '$app/types';

// The parts of a Content row that say where it is edited and where it lives in public
export type ContentLinkRow = {
	id: string;
	type: string;
	show?: { number: number; slug: string } | null;
	video?: { url: string } | null;
};

/** The admin editor for a Content item, or null when its type has none (newsletters, tools). */
export function to_content_edit_path(content_row: ContentLinkRow): Path | null {
	if (content_row.type === 'ARTICLE') return `/admin/content/articles/${content_row.id}`;
	if (content_row.type === 'PODCAST' && content_row.show) {
		return `/admin/content/podcast/${content_row.show.number}`;
	}
	if (content_row.type === 'VIDEO') return `/admin/content/videos/${content_row.id}`;
	return null;
}

/** Where a Content item lives in public: its episode page, or its video. */
export function to_content_public_href(content_row: ContentLinkRow): string | null {
	if (content_row.show) return `/show/${content_row.show.number}/${content_row.show.slug}`;
	if (content_row.video) return content_row.video.url;
	return null;
}
