<script lang="ts">
	import Icon from '#lib/Icon.svelte';
	import TeamMember from '#lib/about/TeamMember.svelte';
	import mesh from '$assets/about/mesh.svg';
	import wes from '$assets/team/wes.webp';
	import scott from '$assets/team/scott.webp';
	import cj from '$assets/team/cj.webp';
	import kaitlin from '$assets/team/kaitlin.webp';
	import randy from '$assets/team/randy.webp';
	import niki from '$assets/team/niki.webp';
	import emo from '$assets/emo.jpg';
	import bboy from '$assets/bboy.jpg';
	import cj_throwback from '$assets/cj.jpg';
	import number1fan from '$assets/kaitlin.jpg';
	import runonlove from '$assets/runonlove.jpg';
	import komatsu from '$assets/komatsu.jpeg';
</script>

<main class="about">
	<h1 class="h1 fv-700-i">About us</h1>

	<div class="intro">
		<p>
			<strong class="fv-700-i">Syntax is more than just a podcast —</strong> it’s a hub for developers
			who want to build, learn, and stay ahead in the world of tech. Founded by Scott Tolinski and Wes
			Bos, Syntax delivers high-quality content across podcasts, video tutorials, deep dives, and more,
			covering everything from frontend frameworks to backend performance. Whether you're leveling up
			your skills or just keeping up with the latest in web development, Syntax is your go-to resource
			for insightful, fun, and practical tech content.
		</p>
		<p class="fv-700-i">Dive in! It's pretty good.</p>
	</div>

	<section class="team" aria-label="Syntax team" style:--mesh="url({mesh})">
		<span class="doodle coffee" aria-hidden="true"
			><Icon name="coffee" width={40} height={40} /></span
		>
		<span class="doodle robot" aria-hidden="true"><Icon name="robot" width={40} height={40} /></span
		>
		<span class="doodle devto" aria-hidden="true"><Icon name="devto" width={40} height={40} /></span
		>

		<TeamMember
			first_name="Wes"
			last_name="Bos"
			face={wes}
			throwback={emo}
			github="wesbos"
			twitter="wesbos"
		>
			Wes Bos is co-host of Syntax and a <a href="https://wesbos.com">web development educator</a>.
			Constantly learning, he creates web development courses focused on JavaScript, TypeScript,
			React, CSS, Node.js and whatever else comes his way.
		</TeamMember>

		<TeamMember
			first_name="Scott"
			last_name="Tolinski"
			face={scott}
			throwback={bboy}
			github="stolinski"
			twitter="stolinski"
		>
			Scott Tolinski is co-host of Syntax and the creator of
			<a href="https://leveluptutorials.com">Level Up Tutorials</a>. In his free time Scott is a
			dedicated Bboy (breakdancer) & enjoys pushing himself athletically through dance, working out
			and snowboarding.
		</TeamMember>

		<TeamMember
			first_name="CJ"
			last_name="Reynolds"
			face={cj}
			throwback={cj_throwback}
			github="w3cj"
			twitter="coding_garden"
		>
			CJ is a Senior Creator at Syntax and the host of <a href="https://coding.garden/"
				>Coding Garden</a
			>. In his spare time CJ enjoys skateboarding, playing board games, collecting VHS tapes and
			hanging out with his dog.
		</TeamMember>

		<TeamMember
			first_name="Kaitlin"
			last_name="Bloom"
			face={kaitlin}
			throwback={number1fan}
			github="bl0om"
			twitter="kaitlinblooom"
		>
			Kaitlin Bloom is Syntax's digital marketing manager. She publishes the Syntax Newsletter,
			manages the Syntax social accounts, and generally tries to figure out how Syntax can better
			reach its audience.
		</TeamMember>

		<TeamMember
			first_name="Randy"
			last_name="Rektor"
			face={randy}
			throwback={runonlove}
			github="randyrektor"
			twitter="randyrektor"
		>
			Randy Rektor is Syntax's producer. He edits the episodes, produces the videos for YouTube, and
			helps keep Syntax's production gears oiled. He is a musician,
			<a href="https://www.youtube.com/@randyrektor">YouTuber</a>, and a self-proclaimed ‘massive
			audio geek’.
		</TeamMember>

		<TeamMember first_name="Niki" last_name="Brandner" face={niki} throwback={komatsu}>
			Niki Brandner is an Amsterdam-based video and audio engineer who studied at SAE Amsterdam.
			From fine-tuning podcasts and editing videos to preparing promotional material, mixing, and
			mastering music, she's passionate about making content sound and look its best.
		</TeamMember>
	</section>
</main>

<style lang="postcss">
	.about {
		display: grid;
		gap: 3rem;
		max-width: 1000px;
		margin-inline: auto;
		margin-block-end: 4rem;
	}

	.intro {
		display: grid;
		gap: 1.25rem;
		font-size: var(--fs-5);
		line-height: 1.7;

		p {
			margin: 0;
		}

		strong {
			font-size: var(--fs-7);
			line-height: 1.4;
		}
	}

	/* Two staggered columns of members: the right-hand column hangs lower. */
	.team {
		--stagger: 5.5rem;

		position: relative;
		display: grid;
		gap: 4rem clamp(2rem, 11vw, 8rem);
		padding-block: 4rem calc(var(--stagger) + 2rem);
		padding-inline: 1.25rem;
		overflow-x: clip;
		isolation: isolate;

		/* Wireframe mesh and two soft colour glows behind the cards. */
		&::before {
			content: '';
			position: absolute;
			z-index: -2;
			inset: 0 0 auto;
			aspect-ratio: 1804 / 704;
			background: var(--c-fg-6);
			mask: var(--mesh, none) center / 100% 100% no-repeat;
			scale: 1 -1;
		}

		&::after {
			content: '';
			position: absolute;
			z-index: -3;
			inset: 0;
			background:
				radial-gradient(closest-side, oklch(from var(--c-pink) l c h / 0.12), transparent) -30%
					10% / 60% 40% no-repeat,
				radial-gradient(closest-side, oklch(from var(--c-teal) l c h / 0.15), transparent) 130%
					40% / 60% 40% no-repeat;
		}

		@media (--above-med) {
			grid-template-columns: repeat(2, minmax(0, 1fr));

			& > :global(.member:nth-of-type(even)) {
				translate: 0 var(--stagger);
			}
		}
	}

	.doodle {
		position: absolute;
		color: var(--c-fg);
	}

	.coffee {
		inset-block-start: 0.5rem;
		inset-inline-start: 1.5rem;
		rotate: -15deg;
	}

	.robot {
		inset-block-start: 34%;
		inset-inline-start: 0;
		rotate: -15deg;
	}

	.devto {
		inset-block-start: 38%;
		inset-inline-end: 0;
		rotate: 15deg;
	}

	@media (--below-med) {
		.intro {
			font-size: var(--fs-4);

			strong {
				font-size: var(--fs-5);
			}
		}

		.doodle {
			display: none;
		}
	}
</style>
