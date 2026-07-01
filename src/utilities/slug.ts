import type { Pathname } from '$app/types';

export default function get_show_path(show: { number: number; slug: string }): Pathname {
	return `/show/${show.number}/${show.slug}`;
}
