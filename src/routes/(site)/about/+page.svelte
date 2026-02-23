<script lang="ts">
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import type { Action } from 'svelte/action';
	import { fly } from 'svelte/transition';
	import emo from '$assets/emo.jpg';
	import bboy from '$assets/bboy.jpg';
	import number1fan from '$assets/kaitlin.jpg';
	import runonlove from '$assets/runonlove.jpg';
	import cj from '$assets/cj.jpg';
	import { count_podcasts } from '$server/shows/shows.remote';

	let hosts = {
		wes: {
			name: 'Wes Bos',
			github: 'wesbos',
			twitter: 'wesbos'
		},
		scott: {
			name: 'Scott Tolinski',
			github: 'stolinski',
			twitter: 'stolinski'
		},
		kaitlin: {
			name: 'Kaitlin Bloom',
			github: 'bl0om',
			twitter: 'kaitlinblooom'
		},
		randy: {
			name: 'Randy Rektor',
			github: 'randyrektor',
			twitter: 'randyrektor'
		},
		cj: {
			name: 'CJ Reynolds',
			github: 'w3cj',
			twitter: 'coding_garden'
		}
	};

	const lol: Action = function (node) {
		const src = node.getAttribute('src');
		const swapper = node.dataset.lol;
		function swap() {
			const toSwap = node.getAttribute('src') === src ? swapper : src;
			if (!swapper || !toSwap) return;
			node.setAttribute('src', toSwap);
		}
		// the node has been mounted in the DOM
		node.addEventListener('pointerenter', swap);
		node.addEventListener('pointerleave', swap);
		return {
			destroy() {
				node.removeEventListener('pointerenter', swap);
				node.removeEventListener('pointerleave', swap);
			}
		};
	};

	const speed = 169;
	let since_start = $state(Date.now() - 1499256000000);

	let interval: ReturnType<typeof setInterval>;
	$effect(() => {
		interval = setInterval(() => {
			since_start = Date.now() - 1499256000000;
		}, 500);
		return () => clearInterval(interval);
	});

	let digits = $derived(since_start.toString().split(''));

	const count = await count_podcasts();
</script>

<main class="about_page">
	<section class="about_intro stack">
		<h1 class="h3 fv-700-i">About Syntax</h1>
		<p>Syntax is a Podcast about Web Development.</p>

		<p>
			Started by Wes and Scott in 2017 <span
				>(
				{#each Array.from({ length: digits.length }, (_, i) => i) as i (i)}
					<span>
						{#key `${digits.at(i)}-${i + 1}`}
							<span
								in:fly={{ duration: speed, y: -15, delay: i * 10 }}
								out:fly={{ duration: speed, y: 15, delay: i * 10 }}>{digits.at(i)}</span
							>
						{/key}
					</span>
				{/each} milliseconds ago to be exact)</span
			>, Syntax has published
			{count} podcast episodes on full-stack web development, covering JavaScript Server + Client, the
			latest Frameworks, HTML, CSS, databases, deployment environments, and a whole lot more!
		</p>

		<p>You should listen! It's pretty good.</p>
	</section>

	<section aria-label="Syntax team">
		<div class="team_grid">
			<article class="host_card">
				<div class="profile_box">
					<img
						class="host_portrait"
						use:lol
						src={`https://github.com/${hosts.wes.github}.png`}
						alt={hosts.wes.name}
						data-lol={emo}
					/>
					<h2 class="host_name">
						<span class="h4 fv-800-i">Wes</span>
						<span class="h6">Bos</span>
					</h2>
					<HostSocialLink host={hosts.wes} />
					<p>
						Wes Bos is co-host of Syntax and a <a href="https://wesbos.com"
							>web development educator</a
						>. Constantly learning, he creates web development courses focused on JavaScript,
						TypeScript, React, CSS, Node.js and whatever else comes his way.
					</p>
				</div>
			</article>

			<article class="host_card">
				<div class="profile_box">
					<img
						class="host_portrait"
						src={`https://github.com/${hosts.scott.github}.png`}
						alt={hosts.scott.name}
						use:lol
						data-lol={bboy}
					/>
					<h2 class="host_name">
						<span class="h4 fv-800-i">Scott</span>
						<span class="h6">Tolinski</span>
					</h2>
					<HostSocialLink host={hosts.scott} />
					<p>
						Scott Tolinski is co-host of Syntax and the creator of <a
							href="https://leveluptutorials.com">Level Up Tutorials</a
						>. In his free time Scott is a dedicated Bboy (breakdancer) & enjoys pushing himself
						athletically through dance, working out and snowboarding.
					</p>
				</div>
			</article>

			<article class="host_card">
				<div class="profile_box">
					<img
						class="host_portrait"
						src={`https://github.com/${hosts.kaitlin.github}.png`}
						alt={hosts.kaitlin.name}
						data-lol={number1fan}
						use:lol
					/>
					<h2 class="host_name">
						<span class="h4 fv-800-i">Kaitlin</span>
						<span class="h6">Bloom</span>
					</h2>
					<HostSocialLink host={hosts.kaitlin} />
					<p>
						Kaitlin Bloom is Syntax's digital marketing manager. She publishes the Syntax
						Newsletter, manages the Syntax social accounts, and generally tries to figure out how
						Syntax can better reach its audience.
					</p>
				</div>
			</article>

			<article class="host_card">
				<div class="profile_box">
					<img
						class="host_portrait"
						use:lol
						src={`https://github.com/${hosts.randy.github}.png`}
						alt={hosts.randy.name}
						data-lol={runonlove}
					/>
					<h2 class="host_name">
						<span class="h4 fv-800-i">Randy</span>
						<span class="h6">Rektor</span>
					</h2>
					<HostSocialLink host={hosts.randy} />
					<p>
						Randy Rektor is Syntax's producer. He edits the episodes, produces the videos for
						YouTube, and helps keep Syntax's production gears oiled. He is a musician, <a
							href="https://www.youtube.com/@randyrektor">YouTuber</a
						>, and a self-proclaimed ‘massive audio geek’.
					</p>
				</div>
			</article>

			<article class="host_card">
				<div class="profile_box">
					<img
						class="host_portrait"
						use:lol
						src={`https://github.com/${hosts.cj.github}.png`}
						alt={hosts.cj.name}
						data-lol={cj}
					/>
					<h2 class="host_name">
						<span class="h4 fv-800-i">CJ</span>
						<span class="h6">Reynolds</span>
					</h2>
					<HostSocialLink host={hosts.cj} />
					<p>
						CJ is a Senior Creator at Syntax and the host of <a href="https://coding.garden/"
							>Coding Garden</a
						>. In his spare time CJ enjoys skateboarding, playing board games, collecting VHS tapes
						and hanging out with his dog.
					</p>
				</div>
			</article>
		</div>
	</section>
</main>

<style lang="postcss">
	.about_page {
		margin-bottom: 2rem;
	}

	.about_intro {
		margin-bottom: 2rem;
	}

	.team_grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: 1fr;
	}

	.host_card {
		position: relative;
		padding-top: 2.75rem;
	}

	.profile_box {
		position: relative;
		padding: 1rem;
		border: var(--b-medium);
		border-radius: var(--br-medium);
		background-color: var(--c-bg);
		background-image: var(--c-bg-grit);
		box-shadow: var(--s-graphic-medium);
	}

	.host_portrait {
		position: absolute;
		top: 0;
		right: 1rem;
		width: 6.25rem;
		height: 6.25rem;
		object-fit: cover;
		border-radius: var(--br-medium);
		border: var(--b-medium);
		background-color: var(--c-bg);
		transform: translateY(-45%);
		box-shadow: 0 0 0 1px color-mix(in lch, var(--c-fg), transparent 78%);
	}

	.host_name {
		display: grid;
		gap: 0;
		margin: 0 0 0.25rem;
	}

	.profile_box :global(p) {
		margin-bottom: 0;
	}

	@media (--below-med) {
		.host_card {
			padding-top: 2.35rem;
		}

		.host_portrait {
			width: 5.5rem;
			height: 5.5rem;
		}
	}

	@media (--above-med) {
		.team_grid {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			column-gap: 2rem;
			row-gap: 1.4rem;
		}

		.host_card:nth-child(2n) {
			margin-top: 2.5rem;
		}
	}
</style>
