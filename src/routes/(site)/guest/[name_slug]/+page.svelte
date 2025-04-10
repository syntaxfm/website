<script lang="ts">
	import ShowCard from '$lib/ShowCard.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';

	let { data } = $props();
	let { guest } = $derived(data);
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
