<script lang="ts">
	import { CURRENT_YEAR } from '$const';
	import FooterLinks from './FooterLinks.svelte';
	import ProducedBySentry from './ProducedBySentry.svelte';
</script>

<footer class="layout zone" style:--bg="var(--bg-root)" style:--fg="var(--fg-1)">
	<div>
		<FooterLinks />

		<ProducedBySentry />

		<div>
			<p>©️ {CURRENT_YEAR} - Sentry.io</p>
		</div>
	</div>
</footer>
