<script lang="ts">
	import HostSocialLink from '$lib/hosts/HostSocialLink.svelte';

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
		}
	};
</script>

<main style:margin-bottom="2rem">
	<h3>About Syntax</h3>
	<p style:margin-bottom="2rem">
		Hosted by Wes Bos and Scott Tolinski since 2017, Syntax has published over 600 podcast episodes
		on full-stack web development, covering everything from HTML, CSS, JavaScript, server side
		languages, databases, deployment environments, and more.
	</p>

	<div class="team-row">
		<div class="team-member">
			<img src={`https://github.com/${hosts.wes.github}.png`} alt={hosts.wes.name} class="avatar" />
			<h4>Wes Bos</h4>
			<HostSocialLink host={hosts.wes} />
			<p>
				Wes Bos is co-host of Syntax and a <a href="https://wesbos.com">web development educator</a
				>. Constantly learning, he creates web development courses focused on JavaScript,
				TypeScript, React, CSS, Node.js and whatever else comes his way.
			</p>
		</div>

		<div class="team-member">
			<img
				src={`https://github.com/${hosts.scott.github}.png`}
				alt={hosts.scott.name}
				class="avatar"
			/>
			<h4>Scott Tolinski</h4>
			<HostSocialLink host={hosts.scott} />
			<p>
				Scott Tolinski is co-host of Syntax and the creator of <a
					href="https://leveluptutorials.com">Level Up Tutorials</a
				>. In his free time Scott is a dedicated Bboy (breakdancer) & enjoys pushing himself
				athletically through dance, working out and snowboarding.
			</p>
		</div>
		<div class="team-member">
			<img
				src={`https://github.com/${hosts.kaitlin.github}.png`}
				alt={hosts.kaitlin.name}
				class="avatar"
			/>
			<h4>Kaitlin Bloom</h4>
			<HostSocialLink host={hosts.kaitlin} />
			<p>
				Kaitlin Bloom is Syntax's digital marketing manager. She publishes the Syntax Newsletter,
				manages the Syntax social accounts, and generally tries to figure out how Syntax can better
				reach its audience.
			</p>
		</div>
		<div class="team-member"><!-- intentionally empty --></div>
	</div>
</main>

<style>
	img.avatar {
		width: 150px;
		border-radius: 8px;
	}

	.team-row {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 2rem;
	}
	.team-member {
		flex-basis: 49%; /* feels like a hack; 50% overflows */
		flex-grow: 1;
		flex-shrink: 1;
		h4 {
			margin-bottom: 0;
			margin-top: 0.5rem;
		}
	}
</style>
