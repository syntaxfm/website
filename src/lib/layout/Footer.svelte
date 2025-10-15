<script lang="ts">
	import { CURRENT_YEAR } from '$const';
	import FooterLinks from './FooterLinks.svelte';
	import ProducedBySentry from './ProducedBySentry.svelte';
</script>

<footer class="layout zone" style:--c-bg="var(--c-bg)" style:--c-fg="var(--c-fg-1)">
	<div>
		<FooterLinks />

		<ProducedBySentry />

		<div>
			<p>©️ {CURRENT_YEAR} - Sentry.io</p>
		</div>
	</div>
</footer>
