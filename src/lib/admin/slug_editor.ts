import get_slug from 'speakingurl';

export function create_admin_slug(input: string): string {
	return get_slug(input, {
		separator: '-',
		truncate: 120,
		symbols: false
	});
}

export function can_auto_update_slug(slug: string, previous_title: string): boolean {
	return slug === '' || slug === create_admin_slug(previous_title);
}

export function initialize_admin_slug(slug: string, title: string): string {
	return slug === '' ? create_admin_slug(title) : slug;
}
