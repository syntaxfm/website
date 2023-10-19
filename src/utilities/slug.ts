export default function get_show_path(show: { number: number; slug: string }) {
	return `/shows/${show.number}/${show.slug}`;
}
