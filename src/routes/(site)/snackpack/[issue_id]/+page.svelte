<script>
	import { format } from 'date-fns';
	export let data;
</script>

<main>
	<header class="center">
		<h2 class="h6">{data.subject}</h2>
		<p class="text-sm">
			You are viewing the Newsletter Archive. Published {format(
				new Date(data.published_at),
				'EEEE MMM dd, yyyy'
			)}
			<br />
			<a href="/snackpack">← Back to all issues</a>
		</p>
	</header>
	<div class="newsletter-output">
		{@html data.html}
	</div>
</main>

<style>
	header {
		padding: var(--default-padding);
	}
	.newsletter-output {
		border: 5px solid black;
		background: white;
		:global(img) {
			max-width: 100%;
		}
		:global(.ck-inner-section) {
			border: 0 !important;
		}
		:global(table) {
			border: 0 !important;
		}
	}
</style>
