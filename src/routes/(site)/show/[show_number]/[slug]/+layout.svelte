<script lang="ts">
	import ShareButton from '$/lib/share/HairButton.svelte';
	import { replace_color } from '$/lib/theme/variable_color_svg.js';
	import { time_param_to_seconds } from '$/utilities/time_param_to_seconds.js';
	import { page } from '$app/stores';
	import HostsAndGuests from '$lib/HostsAndGuests.svelte';
	import Icon from '$lib/Icon.svelte';
	import ListenLinks from '$lib/ListenLinks.svelte';
	import Tabs from '$lib/Tabs.svelte';
	import ShareWindow from '$lib/share/ShareWindow.svelte';
	import { player } from '$state/player';
	import { format } from 'date-fns';
	export let data;
	$: ({ show, time_start } = data);

	async function handleClick(e: Event) {
		const { target } = e;
		if (target instanceof HTMLAnchorElement && target.matches(`a[href*='#t=']`)) {
			e.preventDefault();
			const { href } = target;
			// If we aren't already playing this episode, load it up and then jump it
			if ($player.current_show?.number !== show.number) {
				await player.start_show(show);
			}
			// Jump to timestamp
			player.update_time(href, show);
		}
	}

	function play_show() {
		player.start_show(show, time_param_to_seconds(time_start));
	}

	function variable_svg(node: HTMLElement) {
		replace_color(node);
	}
</script>

<header>
	<div class="pagination-buttons">
		<a href={`/${show.number - 1}`}> PREVIOUS </a>
		<a href={`/${show.number + 1}`}> NEXT </a>
	</div>
	<span
		title="Show #{show.number}"
		style:--transition-name="show-date-{show.number}"
		class="show-number grit">{show.number}</span
	>
	<p class="show-page-date" style:--transition-name="show-date-{show.number}">
		{format(new Date(show.date), 'MMMM do, yyyy')}
		×
		<span class="topics">
			{#each show.aiShowNote?.topics?.slice(0, 5) || [] as topic}
				<span class="topic">{topic.name.startsWith('#') ? '' : '#'}{topic.name}</span>
			{/each}
		</span>
	</p>

	<h1 style:--transition-name="show-title-{show.number}">
		<span class="spa-ran-wrap">{show.title}</span>
	</h1>

	{#if show.aiShowNote?.description}
		<p class="description"><span>{show.aiShowNote?.description}</span></p>
	{/if}
</header>

<div>
	<HostsAndGuests guests={show.guests} />
</div>

<div class="show-actions-wrap">
	<div class="show-actions zone" style="--fg: var(--fg-root);">
		<div class="show-actions-flex">
			<button on:click={play_show} data-testid="play-show">
				<Icon
					--icon_size="12px"
					ariaHidden={true}
					name="play{$player.current_show?.number === show.number && $player.status === 'PLAYING'
						? 'ing'
						: ''}"
				/>
				Play{$player.current_show?.number === show.number ? 'ing' : ''} Episode {show.number}
			</button>
			<span>or</span>
			<ListenLinks {show} />
			<ShareButton {show} />
		</div>
		<div>
			<a class="icon" title="Download Episode" aria-label="Download" download href={show.url}>
				<Icon name="download" />
			</a>
			<a
				title="Edit Show Notes"
				aria-label="Edit Show Notes"
				class="icon"
				href={'https://github.com/syntaxfm/website/tree/main' + show.md_file}
			>
				<Icon name="edit" /></a
			>
		</div>
		<div use:variable_svg class="variable-color-svg waves grit" />
	</div>
</div>

<Tabs>
	<a
		data-sveltekit-noscroll
		class:active={!$page.url.pathname.includes('transcript')}
		href="/show/{$page.params.show_number}/{$page.params.slug}">Show Notes</a
	>
	<a
		class:active={$page.url.pathname.includes('transcript')}
		data-sveltekit-noscroll
		href="/show/{$page.params.show_number}/{$page.params.slug}/transcript">Transcript</a
	>
</Tabs>

<!-- I don't feel great about this one, but it's hard, because these are click targets on show notes coming in from markdown -->
<!-- I have no idea how we would make those timestamps into click targets correctly, maybe we can dynamically add role="button" -->
<!-- Please submit a PR if you have a good fix here :) - Scott -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section class="layout full" on:click={handleClick}>
	<slot />
</section>

<ShareWindow {show} />

<style lang="postcss">
	@layer theme {
		header {
			grid-column: content / content;
			position: relative;
		}

		h1 {
			view-transition-name: var(--transition-name);
			margin-top: 0;
			font-size: var(--font-size-xxl);
			text-shadow:
				1px 0 0 var(--bg),
				0 1px 0 var(--bg),
				-1px 0 0 var(--bg),
				0 -1px 0 var(--bg);
		}

		.description span {
			/* helps a11y when light text overlaps show number */
			background-color: color-mix(in lch, var(--bg), transparent 50%);
		}

		.show-actions-wrap {
			container: show-actions / inline-size;
		}

		.show-actions {
			background: var(--bg-root);
			color: var(--fg-root);
			/* color: color-mix(as lch, var(--bg-sheet), transparent 50%); */
			width: 110%;
			left: -5%;
			overflow: hidden;
			@container (min-width: 90vw) {
				width: 100%;
				left: 0;
			}

			position: relative;
			border-radius: 50px;
			grid-column: content / content;
			padding: 2rem;
			margin-bottom: 2rem;
			font-weight: 700;
			display: flex;
			flex-wrap: wrap;
			place-items: center;
			gap: 1rem;
			justify-content: space-between;
			align-items: center;
			align-content: center;
			a {
				color: var(--fg);
			}
			@media (--below_med) {
				a {
					width: 100%;
				}
			}

			.waves {
				color: var(--accent);
				position: absolute;
				z-index: 0;
				background: url('$assets/waves.svg');
				background: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='1440px' fill='%23FABF46' height='51px' viewBox='0 0 1440 51' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3Ewaves%3C/title%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='%23fill' fill-rule='evenodd'%3E%3Cg id='waves' fill-rule='nonzero'%3E%3Cpath d='M0,39.906568 L6.2,39.906568 C12.3,39.906568 25,39.906568 37,34.3598519 C49.2,28.8131359 62,17.7197039 74,12.1729879 C86.2,6.62627186 98,6.62627186 111,4.77158869 C123.1,2.98623947 135,-0.82712779 148,0.160881 C160,1.07955584 172,6.62627186 185,6.62627186 C196.9,6.62627186 209,1.07955584 222,6.62627186 C233.8,12.1729879 246,28.8131359 258,28.8131359 C270.8,28.8131359 283,12.1729879 295,5.70759702 C307.7,-0.82712779 320,2.98623947 332,8.48095503 C344.6,14.0796715 357,21.3597363 369,25.1211031 C381.5,28.8131359 394,28.8131359 406,25.1211031 C418.5,21.3597363 431,14.0796715 443,13.0916627 C455.4,12.1729879 468,17.7197039 480,23.2664199 C492.3,28.8131359 505,34.3598519 517,38.0518848 C529.2,41.8132516 542,43.5466004 554,37.13321 C566.2,30.7198196 578,15.8130203 591,11.254313 C603.1,6.62627186 615,12.1729879 628,18.6383787 C640,25.1731035 652,32.4531683 665,34.3598519 C676.9,36.2665356 689,32.4531683 702,32.5051688 C713.8,32.4531683 726,36.2665356 738,34.3598519 C750.8,32.4531683 763,25.1731035 775,19.5743871 C787.7,14.0796715 800,10.2663042 812,8.48095503 C824.6,6.62627186 837,6.62627186 849,11.254313 C861.5,15.8130203 874,25.1731035 886,29.7318108 C898.5,34.3598519 911,34.3598519 923,33.4411771 C935.4,32.4531683 948,30.7198196 960,26.9584528 C972.3,23.2664199 985,17.7197039 997,18.6383787 C1009.2,19.6263875 1022,26.9064523 1034,33.4411771 C1046.2,39.906568 1058,45.453284 1071,41.7612511 C1083.1,37.9998843 1095,25.1731035 1108,22.3477451 C1120,19.6263875 1132,26.9064523 1145,27.8944611 C1156.9,28.8131359 1169,23.2664199 1182,24.1850948 C1193.8,25.1731035 1206,32.4531683 1218,38.0518848 C1230.8,43.5466004 1243,47.3599676 1255,44.5346091 C1267.7,41.8132516 1280,32.4531683 1292,26.9584528 C1304.6,21.3597363 1317,19.6263875 1329,14.9463459 C1341.5,10.2663042 1354,2.98623947 1366,1.99823068 C1378.5,1.07955584 1391,6.62627186 1403,14.027671 C1415.4,21.3597363 1428,30.7198196 1434,35.2785268 L1440,39.906568 L1440,51 L1433.8,51 C1427.7,51 1415,51 1403,51 C1390.8,51 1378,51 1366,51 C1353.8,51 1342,51 1329,51 C1316.9,51 1305,51 1292,51 C1280,51 1268,51 1255,51 C1243.1,51 1231,51 1218,51 C1206.2,51 1194,51 1182,51 C1169.2,51 1157,51 1145,51 C1132.3,51 1120,51 1108,51 C1095.4,51 1083,51 1071,51 C1058.5,51 1046,51 1034,51 C1021.5,51 1009,51 997,51 C984.6,51 972,51 960,51 C947.7,51 935,51 923,51 C910.8,51 898,51 886,51 C873.8,51 862,51 849,51 C836.9,51 825,51 812,51 C800,51 788,51 775,51 C763.1,51 751,51 738,51 C726.2,51 714,51 702,51 C689.2,51 677,51 665,51 C652.3,51 640,51 628,51 C615.4,51 603,51 591,51 C578.5,51 566,51 554,51 C541.5,51 529,51 517,51 C504.6,51 492,51 480,51 C467.7,51 455,51 443,51 C430.8,51 418,51 406,51 C393.8,51 382,51 369,51 C356.9,51 345,51 332,51 C320,51 308,51 295,51 C283.1,51 271,51 258,51 C246.2,51 234,51 222,51 C209.2,51 197,51 185,51 C172.3,51 160,51 148,51 C135.4,51 123,51 111,51 C98.5,51 86,51 74,51 C61.5,51 49,51 37,51 C24.6,51 12,51 6,51 L0,51 L0,39.906568 Z' id='Path'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A");
				height: 20px;
				width: 100%;
				left: 0;
				bottom: 0;
				background-size: auto 20px;
				background-repeat: repeat-x;
				background-position: left 0;
				animation: ripple 60s linear infinite;
			}
		}

		.show-page-date {
			view-transition-name: var(--transition-name);
		}
		.topics {
			display: inline-flex;
			flex-wrap: wrap;
			gap: 0 1rem;
		}
		.show-number {
			position: absolute;
			right: 0;
			top: 10%;
			transform: translate(6.9%, -22%);
			--max-font-size: 15rem;
			font-size: clamp(1.5rem, 45cqw, var(--max-font-size));
			font-weight: 900;
			color: var(--primary);
			line-height: 1;
			transform: rotate(-2deg);
			z-index: 0;
			& ~ * {
				position: relative;
			}
		}

		.show-actions-flex {
			display: flex;
			align-items: center;
			gap: 8px;
			span {
				margin-inline: 5px;
			}
		}

		.pagination-buttons {
			display: flex;
			gap: 0 1rem;

			a {
				display: block;
				text-decoration: none;
				background: var(--nav_a_bg, rgba(255, 255, 255, 0.0786987545689));
				padding: 10px 20px;
				@media (--below_large) {
					padding: 8px 16px;
					font-size: var(--font-size-xs);
				}
				border: 0;
				border-radius: 20px;
				align-items: center;
				display: none;
				max-width: 100;
				&:hover {
					border: 0;
					background: var(--primary);
					color: var(--bg);
				}
				&.active {
					background-color: var(--primary);
					color: var(--bg);
				}
				@media (--above_med) {
					display: block;
				}
			}
		}
	}
</style>
