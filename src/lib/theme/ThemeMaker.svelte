<script lang="ts">
	import { clickOutside } from '$actions/click_outside';
	import { theme, theme_maker } from '$state/theme';
	import slugo from 'slugo';
	import { fly } from 'svelte/transition';
	// when a new theme is selected, apply the class directly to the correct element,
	// and save the theme name to the user's db record
	const themes = import.meta.glob('$themes/*.css', { eager: true });
	const themeName = /(?<=\/src\/themes\/)(.*)(?=.css)/;

	// TODO refactor to utility function
	function getThemeName(path: string) {
		return path.match(themeName)?.[0];
	}

	// Always use system and light which are just base styles
	const theme_names = ['system', 'light', ...Object.keys(themes).map(getThemeName)];
	function change_theme(this: HTMLButtonElement, e: Event) {
		// 1. set to theme state, for instant ui responsiveness
		$theme = slugo(this.innerText);
		// 2. Set to db for ssr and persistance
	}
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === 'e' && (navigator.platform === 'MacIntel' ? e.metaKey : e.ctrlKey)) {
			e.preventDefault();
			theme_maker.open();
		}
	}}
/>

{#if $theme_maker.status === 'OPEN'}
	<section
		use:clickOutside
		on:click-outside={theme_maker.close}
		transition:fly={{ x: '100%', opacity: 0 }}
	>
		<button on:click={theme_maker.close}>Close</button>

		<h4>Theme 👩‍🎨</h4>

		<div class="theme-maker-buttons">
			{#each theme_names as theme_name}
				<button on:click={change_theme} class={'theme-preview theme-' + theme_name}>
					<div class="circle color" />
					<div class="circle primary" />
					<div class="circle accent" />
					<div class="circle warning" />
					<span>
						{theme_name?.replaceAll('-', ' ')}
					</span>
				</button>
			{/each}
		</div>
	</section>
{/if}

<!-- Themes should be only in json or in a users settings. -->
<!-- Saved as a cookie -->

<style>
	section {
		position: fixed;
		top: 0;
		right: 0;
		width: 300px;
		height: 100vh;
		overflow: hidden;
		background: var(--bg);
		color: var(--color);
		padding: var(--default_padding);
		overflow-y: scroll;
	}

	button {
		text-transform: capitalize;
		color: var(--sheet-color);
		background: var(--sheet-bg);
		border: solid 1px var(--white);
		border-radius: 5px;
		padding: var(--default_padding);
	}
	.theme-preview {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		& span {
			flex-basis: 100%;
			margin-top: 1em;
		}
	}

	.circle {
		flex-shrink: 0;
		flex-grow: 0;
		display: block;
		height: 20px;
		width: 20px;
		border-radius: 20px;
		--gap: 0.5rem;
		flex: 0 0 calc(25% - var(--gap)); /* Subtract twice the desired gap size */
		background: #ddd; /* Just for demo purposes */
		margin: calc(var(--gap) / 2); /* Half the desired gap size */
	}

	.color {
		background: var(--sheet-color);
	}
	.primary {
		background: var(--primary);
	}
	.accent {
		background: var(--accent);
	}
	.warning {
		background: var(--warning);
	}

	.theme-maker-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		grid-gap: 1rem;
	}
</style>
