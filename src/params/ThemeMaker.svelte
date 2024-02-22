<script lang="ts">
	import { clickOutside } from '$actions/click_outside';
	import { invalidate } from '$app/navigation';
	import { theme_maker } from '$state/theme';
	import Cookie from 'js-cookie';
	import { fly } from 'svelte/transition';
	// when a new theme is selected, apply the class directly to the correct element,
	// and save the theme name to the user's db record
	const themes = import.meta.glob('$styles/themes/*.css', { eager: true });

	// TODO refactor to utility function
	function getThemeName(path: string) {
		let match_temp = path.split('/').pop()?.split('.')[0];
		return match_temp;
	}

	// Always use system and light which are just base styles
	const theme_names = ['system', 'light', ...Object.keys(themes).map(getThemeName)];

	function change_theme(this: HTMLButtonElement, e: Event) {
		// Set cookie for server side theme change
		Cookie.set('theme', this.innerText);
		const theme_wrapper = document.querySelector('.theme-wrapper');
		// Update the dom manually
		if (theme_wrapper) theme_wrapper.className = 'theme-' + this.innerText + ' theme-wrapper';
		// Invalidate the route
		// Load new server data
		invalidate('/');
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
		transition:fly={{ x: '100%', opacity: 0 }}
		use:clickOutside
		on:click-outside={theme_maker.close}
	>
		<h4>👩‍🎨 <button class="close" on:click={theme_maker.close}>×</button></h4>

		<div class="theme-maker-buttons">
			{#each theme_names as theme_name}
				<button on:click={change_theme} class={'theme-preview theme-' + theme_name}>
					<div class="circle color" />
					<div class="circle primary" />
					<div class="circle accent" />
					<div class="circle warning" />
					<span>
						{theme_name}
					</span>
				</button>
			{/each}
		</div>
	</section>
{/if}

<!-- Themes should be only in json or in a users settings. -->
<!-- Saved as a cookie -->

<style lang="postcss">
	section {
		position: fixed;
		top: 0;
		right: 0;
		width: 300px;
		height: 100vh;
		overflow: hidden;
		backdrop-filter: blur(10px);
		color: var(--fg);
		padding: var(--default_padding);
		overflow-y: scroll;
		border-left: var(--border);
		box-shadow: var(--shadow-6);
		z-index: 10;
	}

	h4 {
		font-style: normal;
		margin-top: 0;
	}

	.close {
		position: absolute;
		top: 20px;
		right: 20px;
	}

	.theme-preview {
		display: flex;
		background: var(--bg-sheet);
		flex-wrap: wrap;
		background: var(--bg-sheet);
		color: var(--fg-sheet);
		justify-content: space-between;
		& span {
			flex-basis: 100%;
			font-weight: 400;
		}
	}

	.circle {
		height: 15px;
		width: 15px;
		border-radius: 20px;
	}

	.color {
		background: var(--fg-sheet);
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
