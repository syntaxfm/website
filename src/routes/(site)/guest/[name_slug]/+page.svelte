<script lang="ts">
	import { page } from '$app/state';
	import ShowCard from '$lib/ShowCard.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import { getGuest } from '../guests.remote';

	const guest = await getGuest(page.params.name_slug!);
</script>

{#if guest}
	<section>
		<header>
			<img src={`https://github.com/${guest.github}.png`} alt={guest.name} />
			<div>
				<h1>{guest.name}</h1>
				{#if guest.twitter}
					<div>
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
