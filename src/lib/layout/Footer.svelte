<script lang="ts">
	import { CURRENT_YEAR } from '$const';
	import FooterLinks from './FooterLinks.svelte';
	import ProducedBySentry from './ProducedBySentry.svelte';
</script>

<footer>
	<div>
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

	/* Constrain footer content to the same centered column as `.layout-main`
	   (and the FollowBanner above), so the link columns and Sentry banner don't
	   stretch the full viewport. */
	footer > div {
		max-width: 1200px;
		margin-inline: auto;
		padding-inline: var(--layout-padding, var(--padding, 2rem));
	}
</style>
