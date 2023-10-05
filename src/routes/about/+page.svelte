<script lang="ts">
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';
	import type { Action } from 'svelte/action';
	import emo from '$assets/emo.jpg';
	import bboy from '$assets/bboy.jpg';
	import benjamin from '$assets/benjamin.jpg';
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
		ben: {
			name: 'Ben Vinegar',
			github: 'benvinegar',
			twitter: 'bentlegen'
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
</script>

<main style:margin-bottom="2rem">
	<h1 class="h3">About Syntax</h1>
	<p style:margin-bottom="2rem" class="readable">
		Hosted by Wes Bos and Scott Tolinski since 2017, Syntax has published over 600 podcast episodes
		on full-stack web development, covering everything from HTML, CSS, JavaScript, server side
		languages, databases, deployment environments, and more.
	</p>

	<div class="team-row">
		<div class="team-member">
			<img
				use:lol
				src={`https://github.com/${hosts.wes.github}.png`}
				alt={hosts.wes.name}
				class="avatar"
				data-lol={emo}
			/>
			<h2 class="h4">
				<span class="first">Wes</span>
				<span class="last" style:--letterCount={'Bos'.length}>Bos</span>
			</h2>
			<div class="desc">
				<HostSocialLink host={hosts.wes} />
				<p>
					Wes Bos is co-host of Syntax and a <a href="https://wesbos.com"
						>web development educator</a
					>. Constantly learning, he creates web development courses focused on JavaScript,
					TypeScript, React, CSS, Node.js and whatever else comes his way.
				</p>
			</div>
		</div>

		<div class="team-member">
			<img
				src={`https://github.com/${hosts.scott.github}.png`}
				alt={hosts.scott.name}
				class="avatar"
				use:lol
				data-lol={bboy}
			/>
			<h2 class="h4">
				<span class="first">Scott</span>
				<span class="last" style:--letterCount={'Tolinski'.length}>Tolinski</span>
			</h2>
			<div class="desc">
				<HostSocialLink host={hosts.scott} />
				<p>
					Scott Tolinski is co-host of Syntax and the creator of <a
						href="https://leveluptutorials.com">Level Up Tutorials</a
					>. In his free time Scott is a dedicated Bboy (breakdancer) & enjoys pushing himself
					athletically through dance, working out and snowboarding.
				</p>
			</div>
		</div>
		<div class="team-member">
			<img
				src={`https://github.com/${hosts.kaitlin.github}.png`}
				alt={hosts.kaitlin.name}
				class="avatar"
				use:lol
			/>
			<h2 class="h4">
				<span class="first">Kaitlin</span>
				<span class="last" style:--letterCount={'Bloom'.length}>Bloom</span>
			</h2>
			<div class="desc">
				<HostSocialLink host={hosts.kaitlin} />
				<p>
					Kaitlin Bloom is Syntax's digital marketing manager. She publishes the Syntax Newsletter,
					manages the Syntax social accounts, and generally tries to figure out how Syntax can
					better reach its audience.
				</p>
			</div>
		</div>
		<div class="team-member">
			<img
				use:lol
				src={`https://github.com/${hosts.ben.github}.png`}
				alt={hosts.ben.name}
				class="avatar"
				data-lol={benjamin}
			/>
			<h2 class="h4">
				<span class="first">Ben</span>
				<span class="last" style:--letterCount={'Vinegar'.length}>Vinegar</span>
			</h2>
			<div class="desc">
				<HostSocialLink host={hosts.ben} />
				<p>
					Ben Vinegar is Syntax's General Manager. He helps with the business stuff so the team can
					focus on what they do best. As a developer, Ben built early versions of the <a
						href="https://sentry.io">Sentry</a
					>
					UI and JS SDKs, and once co-wrote
					<a href="https://www.amazon.ca/Third-Party-JavaScript-Ben-Vinegar/dp/1617290548"
						>a book on JavaScript</a
					>.
				</p>
			</div>
		</div>
	</div>
</main>

<style lang="postcss">
	img.avatar {
		width: 100%;
		border-radius: 8px;
		aspect-ratio: 1 / 1;
		object-fit: cover;
	}

	.team-row {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		grid-gap: 40px;
	}

	.team-member {
		position: relative;
		container: team-member / inline-size;
		h2 {
			position: absolute;
			top: 0;
			line-height: 1;
			overflow: visible;
			color: white;
			span {
				display: block;
			}
			.first {
				color: var(--fg);
				font-size: var(--font-size-md);
				letter-spacing: normal;
				background: var(--yellow);
				width: max-content;
				padding-inline: 0.5rem;
			}
			.last {
				/* text-shadow: 0 0 5px rgba(0, 0, 0, 0.2); */
				padding-left: 5px;
				font-size: 20cqw;
				background-image: linear-gradient(-1.69deg, white 0% 45%, transparent 45% 49%, white 49%);
				color: transparent;
				-webkit-background-clip: text;
			}
		}
		.desc {
			background: rgba(255, 255, 255, 0.96);
			width: 90%;
			border-radius: var(--brad);
			box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
			margin: 0 auto;
			position: relative;
			margin-top: -15cqw;
			padding: var(--default_padding);
		}
	}
</style>
