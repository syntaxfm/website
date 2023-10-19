export default function get_show_path(show: { number: number; slug: string }) {
	console.log(show);
	return `/shows/${show.number}/${show.slug}`;
}
