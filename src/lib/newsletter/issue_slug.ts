// A Snack Pack issue's Content slug carries its Kit broadcast id, which /snackpack/[issue_id] uses

const NEWSLETTER_SLUG_PREFIX = 'snack-pack-';

export function get_newsletter_issue_slug(kit_broadcast_id: string): string {
	return `${NEWSLETTER_SLUG_PREFIX}${kit_broadcast_id}`;
}

/** The Kit broadcast id in a newsletter's slug, or null for a slug the sync didn't make. */
export function newsletter_issue_id_from_slug(slug: string): string | null {
	if (!slug.startsWith(NEWSLETTER_SLUG_PREFIX)) return null;
	return slug.slice(NEWSLETTER_SLUG_PREFIX.length) || null;
}
