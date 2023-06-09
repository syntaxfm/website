<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';

	export let data;
	$: ({ guest } = data);
</script>

<section>
	<header>
		<img src={`https://github.com/${guest.github}.png`} alt={guest.name} />
		<h1>{guest.name}</h1>
	</header>
	<div class="guest_socials">
		<HostSocialLink link={`https://twitter.com/${guest.twitter}`} />
	</div>
	{#each guest.shows as { Show }}
		<ShowCard show={Show} display="list" />
	{/each}
</section>

<style>
	header {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 20px;
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin-bottom: 0rem;
	}

	img {
		border-radius: 4px;
		max-width: 100px;
	}

	.guest_socials {
		display: flex;
		gap: 10px;
		margin-bottom: 2rem;
	}
</style>
