<script lang="ts">
	import get_show_path from '$/utilities/slug.js';
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import { getAllGuests } from '../guest/guests.remote';

	const all_guests = await getAllGuests();
	let guests: typeof all_guests = $state(all_guests);

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
			return b.shows[0].show.number - a.shows[0].show.number;
		});
	}
	let name_size_direction = $state('');

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
	<h1>Guests</h1>
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
		<p class="fs-caption">&hearts; hardly useful filters &hearts;</p>
		<button onclick={jumble}>Jumble</button>
		<button onclick={most_recent}>Most Recent</button>
		<button onclick={name_size}
			>Name Size {name_size_direction ? (name_size_direction === 'desc' ? '↓' : '↑') : ''}</button
		>
	</div>

	<div>
		{#each guests as guest, index}
			<div>
				<div>
					<a href="/guest/{guest.name_slug}">
						<img
							src="https://github.com/{guest.github || 'null'}.png"
							alt={guest.name}
							width="460"
							height="460"
							loading={index < 10 ? 'eager' : 'lazy'}
						/>
					</a>
				</div>
				<div class="info">
					<h2
						style="

--chars: {guest.name.length}"
					>
						<a href="/guest/{guest.name_slug}">{guest.name}</a>
					</h2>
					<p>{guest.of || ``}&nbsp;</p>
					<div class="center">
						<HostSocialLink host={guest} />
					</div>
					<div>
						{#each guest.shows as { show }}
							<a title={show.title} class="grit" href={get_show_path(show)}>#{show.number}</a>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
