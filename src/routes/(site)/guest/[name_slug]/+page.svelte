<script lang="ts">
	import { page } from '$app/state';
	import ShowCard from '$lib/ShowCard.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import { get_guest } from '../guests.remote';

	const guest = await get_guest(page.params.name_slug!);

	const shows = $derived(
		[...(guest?.showGuests ?? [])]
			.map((show_guest) => show_guest.show)
			.sort((a, b) => b.number - a.number)
	);
</script>

{#if guest}
	<Meta title={guest.name} />

	<section class="guest">
		<header>
			<img
				class="avatar"
				src={`https://github.com/${guest.github || 'null'}.png`}
				alt={guest.name}
				width="120"
				height="120"
			/>
			<div>
				<h1 class="h2">{guest.name}</h1>
				{#if guest.of}
					<p class="of">{guest.of}</p>
				{/if}
				{#if guest.twitter || guest.github || guest.url}
					<div class="socials">
						<HostSocialLink host={guest} />
					</div>
				{/if}
			</div>
		</header>

		<div class="shows stack">
			{#each shows as show (show.number)}
				<ShowCard {show} display="list" />
			{/each}
		</div>
	</section>
{/if}

<style lang="postcss">
	.guest {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		padding-block: 1.5rem 4rem;
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--pad-large);
	}

	.avatar {
		width: 120px;
		height: 120px;
		object-fit: cover;
		border-radius: 50%;
		border: var(--b-medium);
		flex-shrink: 0;
	}

	h1 {
		margin: 0;
	}

	.of {
		margin: 0.25rem 0 0;
		color: var(--c-fg-7);
	}

	.socials {
		display: flex;
		gap: 14px;
		margin-top: 0.75rem;

		--icon_size: 18px;
	}

	.shows {
		--stack-gap: 0;
	}

	@media (--below-med) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
