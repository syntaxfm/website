import type { Path } from '$app/types';

export default function get_show_path(show: { number: number; slug: string }): Path {
	return `/show/${show.number}/${show.slug}`;
}
