export default function get_show_path(show: { number: number; slug: string }) {
	return `/show/${show.number}/${show.slug}`;
}
