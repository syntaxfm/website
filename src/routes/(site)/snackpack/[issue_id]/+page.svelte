<script>
	import { format } from 'date-fns';
	/**
	 * @typedef {Object} Props
	 * @property {any} data
	 */

	/** @type {Props} */
	let { data } = $props();
</script>

<main>
	<header class="center">
		<h2 class="h6">{data.subject}</h2>
		<p class="fs-caption">
			You are viewing the Newsletter Archive. Published {format(
				new Date(data.published_at),
				'EEEE MMM dd, yyyy'
			)}
			<br />
			<a href="/snackpack">← Back to all issues</a>
		</p>
	</header>
	<div>
		{@html data.html}
	</div>
</main>
