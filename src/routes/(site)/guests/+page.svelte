<script lang="ts">
	import get_show_path from '$utilities/slug';
	import { resolve } from '$app/paths';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import Meta from '$lib/meta/Meta.svelte';
	import { getAllGuests } from '../guest/guests.remote';

	const all_guests = await getAllGuests();
	type Guest = (typeof all_guests)[number];
	type SortMode = 'az' | 'recent' | 'jumble';

	const MAX_BADGES = 6;

	let active_sort = $state<SortMode>('az');
	let search = $state('');
	let ordered = $state<Guest[]>([...all_guests]);

	function latest_episode(guest: Guest) {
		return guest.showGuests.reduce(
			(latest, { show }) => (show && show.number > latest ? show.number : latest),
			0
		);
	}

	function episodes_newest_first(guest: Guest) {
		return guest.showGuests
			.map(({ show }) => show)
			.filter((show): show is NonNullable<typeof show> => show !== null)
			.sort((a, b) => b.number - a.number);
	}

	function sort_az() {
		active_sort = 'az';
		ordered = [...all_guests].sort((a, b) => a.name.localeCompare(b.name));
	}

	function sort_recent() {
		active_sort = 'recent';
		ordered = [...all_guests].sort((a, b) => latest_episode(b) - latest_episode(a));
	}

	function jumble() {
		active_sort = 'jumble';
		const shuffled = [...ordered];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		ordered = shuffled;
	}

	const visible = $derived.by(() => {
		const term = search.trim().toLowerCase();
		if (!term) return ordered;
		return ordered.filter(
			(guest) =>
				guest.name.toLowerCase().includes(term) || (guest.of ?? '').toLowerCase().includes(term)
		);
	});
</script>

<Meta title="Guests" />

<section class="guests">
	<header class="intro">
		<h1 class="h1 fv-700-i">Guests</h1>
		<p>
			Every Friday we have an industry expert on the show — we call it
			<strong>"Supper Club"</strong>. This isn't a book tour, these are real developers who write
			the code and shape what the future of web development looks like.
		</p>
		<p>
			We keep a running list of all {all_guests.length} guests on
			<a href="https://twitter.com/i/lists/1719788389681987648"><strike>twitter</strike> 𝕏</a>. You
			should follow it!
		</p>
	</header>

	<div class="toolbar">
		<input
			class="search"
			type="search"
			bind:value={search}
			placeholder="Search guests"
			aria-label="Search guests"
		/>
		<div class="sort" role="group" aria-label="Sort guests">
			<button class:active={active_sort === 'az'} onclick={sort_az}>A–Z</button>
			<button class:active={active_sort === 'recent'} onclick={sort_recent}>Most Recent</button>
			<button class:active={active_sort === 'jumble'} onclick={jumble}>Jumble</button>
		</div>
	</div>

	{#if visible.length === 0}
		<p class="empty">No guests match “{search}”.</p>
	{:else}
		<ul class="guests-grid no-list">
			{#each visible as guest, index (guest.id)}
				{@const episodes = episodes_newest_first(guest)}
				<li class="card">
					<a
						class="avatar"
						href={resolve(`/guest/${guest.name_slug}`)}
						tabindex="-1"
						aria-hidden="true"
					>
						<img
							src={`https://github.com/${guest.github || 'null'}.png`}
							alt={guest.name}
							width="300"
							height="300"
							loading={index < 12 ? 'eager' : 'lazy'}
						/>
					</a>
					<div class="info">
						<h2 class="name h4">
							<a href={resolve(`/guest/${guest.name_slug}`)}>{guest.name}</a>
						</h2>
						{#if guest.of}
							<p class="of">{guest.of}</p>
						{/if}
						{#if guest.twitter || guest.github || guest.url}
							<div class="socials">
								<HostSocialLink host={guest} />
							</div>
						{/if}
						{#if episodes.length}
							<div class="episodes">
								{#each episodes.slice(0, MAX_BADGES) as show (show.number)}
									<a class="episode" href={resolve(get_show_path(show))} title={show.title}
										>#{show.number}</a
									>
								{/each}
								{#if episodes.length > MAX_BADGES}
									<a class="episode more" href={resolve(`/guest/${guest.name_slug}`)}
										>+{episodes.length - MAX_BADGES}</a
									>
								{/if}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style lang="postcss">
	.guests {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-block: 1.5rem 4rem;
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 66rem;

		h1 {
			margin: 0;
		}
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--pad-medium);
		align-items: center;
		justify-content: space-between;
	}

	.search {
		flex: 1 1 240px;
		max-width: 360px;
		font-family: inherit;
		font-size: var(--fs-3);
		color: var(--c-fg);
		background: var(--c-bg);
		border: 1px solid var(--c-fg-2);
		border-radius: var(--br-small);
		padding: 6px 12px;

		&:focus-visible {
			outline: 2px solid var(--c-primary);
			outline-offset: 1px;
			border-color: var(--c-primary);
		}
	}

	.sort {
		display: flex;
		gap: 6px;

		button {
			font-size: var(--fs-2);
			background: transparent;
			color: var(--c-fg);
			border: 1px solid var(--c-fg-2);
			padding: 4px 12px;

			&:hover {
				background: var(--c-fg-1);
			}

			&.active {
				background: var(--c-fg);
				color: var(--c-bg);
				border-color: var(--c-fg);
			}
		}
	}

	.guests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: var(--pad-medium);
	}

	.card {
		display: flex;
		flex-direction: column;
		background: var(--c-bg);
		border: 1px solid var(--c-fg-1);
		border-radius: var(--br-medium);
		overflow: hidden;
		transition: border-color 0.2s ease;

		&:hover {
			border-color: var(--c-primary);
		}
	}

	.avatar {
		display: block;
		aspect-ratio: 1;
		background: var(--c-fg-1);

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.info {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.6rem;
		padding: var(--pad-medium);
	}

	.name {
		margin: 0;
		line-height: 1.15;

		a {
			color: var(--c-fg);

			&:hover {
				color: var(--c-primary);
			}
		}
	}

	.of {
		margin: 0;
		font-size: var(--fs-1);
		line-height: 1.4;
		color: var(--c-fg-6);
	}

	.socials {
		display: flex;
		gap: 12px;
	}

	.episodes {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: auto;
		padding-top: 0.4rem;
	}

	.episode {
		font-size: var(--fs-1);
		line-height: 1.6;
		padding: 1px 7px;
		border-radius: var(--br-small);
		background: var(--c-fg-1);
		color: var(--c-fg);

		&:hover {
			background: var(--c-primary);
			color: var(--c-black);
		}

		&.more {
			background: transparent;
			color: var(--c-fg-6);
		}
	}

	.empty {
		color: var(--c-fg-6);
	}
</style>
