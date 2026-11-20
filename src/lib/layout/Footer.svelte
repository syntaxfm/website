<script lang="ts">
	import { CURRENT_YEAR } from '$const';
	import FooterLinks from './FooterLinks.svelte';
	import ProducedBySentry from './ProducedBySentry.svelte';
</script>

<footer>
	<div class="layout-main">
		<FooterLinks />

		<ProducedBySentry />

		<div>
			<p>©️ {CURRENT_YEAR} - Sentry.io</p>
		</div>
	</div>
</footer>

<style>
	footer {
		margin-top: 4rem;
	}
</style>
