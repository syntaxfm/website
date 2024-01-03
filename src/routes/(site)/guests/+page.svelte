<script lang="ts">
	import get_show_path from '$/utilities/slug.js';
	import ShowCard from '$lib/ShowCard.svelte';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';

	export let data;
	$: ({ guests } = data);

	function jumble() {
		let currentIndex = guests.length,
			randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[guests[currentIndex], guests[randomIndex]] = [guests[randomIndex], guests[currentIndex]];
		}

		return guests;
	}

	function most_recent() {
		guests = guests.sort((a, b) => {
			return b.shows[0].Show.number - a.shows[0].Show.number;
		});
	}
	$: name_size_direction = '';
	function name_size() {
		name_size_direction = name_size_direction === 'asc' ? 'desc' : 'asc';
		guests = guests.sort((a, b) => {
			return name_size_direction === 'desc'
				? b.name.length - a.name.length
				: a.name.length - b.name.length;
		});
	}
</script>

<section>
	<h1 class="lines">Guests</h1>
	<p>
		Every Friday we have an industry expert on the show - we call it <strong>"Supper Club"</strong>.
		This isn't a book tour, these are real developers who write the code and shape what the future
		of web development looks like.
	</p>
	<p>
		We maintain a list of all {guests.length} guests on
		<a href="https://twitter.com/i/lists/1719788389681987648"><strike>twitter</strike> 𝕏</a>. You
		should follow it!
	</p>

	<div class="center" style:margin-bottom="1rem">
		<p class="text-sm lines">&hearts; hardly useful filters &hearts;</p>
		<button on:click={jumble}>Jumble</button>
		<button on:click={most_recent}>Most Recent</button>
		<button on:click={name_size}
			>Name Size {name_size_direction ? (name_size_direction === 'desc' ? '↓' : '↑') : ''}</button
		>
	</div>

	<div class="guests">
		{#each guests as guest, index}
			<div class="guest">
				<div>
					<a href="/guest/{guest.name_slug}">
						<img src="https://github.com/{guest.github || 'null'}.png" alt={guest.name} width="460" height="460" loading={index < 10 ? 'eager' : 'lazy'} />
					</a>
				</div>
				<div class="info">
					<h2 style="--chars: {guest.name.length}">
						<a href="/guest/{guest.name_slug}">{guest.name}</a>
					</h2>
					<p class="of">{guest.of || ``}&nbsp;</p>
					<div class="socials center">
						<HostSocialLink host={guest} />
					</div>
					<div class="show-links">
						{#each guest.shows as { Show }}
							<a title={Show.title} class="grit" href={get_show_path(Show)}>#{Show.number}</a>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<style lang="postcss">
	.guests {
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}
	.guest {
		display: grid;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		overflow: hidden;
		container: guest / inline-size;
		h2 {
			/* Size the font by the number of chars, but don't
        go smaller than 8cqw */
			font-size: min(calc(135cqw / var(--chars)), 8cqw);
			color: var(--dark);
			background: var(--primary);
			text-align: center;
			width: max-content;
			margin: 0 auto;
			padding: 0 5px;
			margin-top: -5cqw;
			transform: rotate(-0.5deg);
		}
		& > * {
			grid-row: 1;
			grid-column: 1;
			width: 100%;
		}
		.info {
			grid-row: 2;
			grid-column: 1;
		}

		img {
			width: 100%;
			height: 100%;
			aspect-ratio: 1/1;
			object-fit: cover;
		}
	}
	.show-links {
		text-align: center;
		display: flex;
		gap: 10px;
		place-items: center;
		justify-content: center;
		a {
			background: var(--primary);
			color: var(--dark);
			display: block;
			font-weight: 600;
			padding: 1px;
			line-height: 1;
		}
	}
	.of {
		margin: 0;
		text-align: center;
		padding: 0;
		font-size: var(--font-size-xs);
	}
	.info {
		padding-bottom: 1rem;
	}
</style>
