<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';

	export let data;
	$: ({ guest } = data);
</script>

{#if guest}
	<section>
		<header>
			<img src={`https://github.com/${guest.github}.png`} alt={guest.name} />
			<div>
				<h1>{guest.name}</h1>
				{#if guest.twitter}
					<div class="guest_socials">
						<HostSocialLink host={guest} />
					</div>
				{/if}
			</div>
		</header>
		{#each guest.shows as { Show }}
			<ShowCard show={Show} display="list" />
		{/each}
	</section>
{/if}

<style>
	header {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 20px;
		align-items: center;
		margin: 2rem 0;
	}

	h1 {
		margin: 0rem 0 0.5rem;
	}

	img {
		border-radius: 4px;
		max-width: 100px;
	}

	.guest_socials {
		display: flex;
		gap: 10px;
	}
</style>
