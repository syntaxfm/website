<script lang="ts">
	import white_grit from '$assets/whitegrit.png';
	import { fade, fly } from 'svelte/transition';

	let is_active = false;

	function toggle() {
		return (is_active = !is_active);
	}
</script>

<div class="mobile_nav">


<button class="button-reset" on:click={toggle}>Menu</button>
{#if is_active}
	<div
		transition:fly={{ opacity: 0 }}
		id="menu"
		class="menu"
		style="background-image:  url({white_grit})"
	>
		<button class="button-reset close-button" on:click={toggle}>×</button>
		<nav>
			<a href="/shows">Podcast</a>
			<a href="https://swag.syntax.fm">Swag</a>
		</nav>
		<a
			target="_blank"
			class="button ghost"
			href="https://docs.google.com/forms/d/e/1FAIpQLSfQlAo1wXHiJMySdU-h8QMtfoz92aMS9eycEHXB6eRCLh8KHA/viewform"
			>Ask a potluck question</a
		>
	</div>
{/if}
</div>

<style lang="postcss">
	.mobile_nav {
		@media (--above_med) {
			display: none;
		}
	}
	nav a {
		text-decoration: none;
		color: var(--color);
		text-decoration: none;
		border-bottom: solid 3px transparent;
		transition: border-color 0.2s ease;
		&:hover {
			border-bottom: solid 3px var(--primary);
		}
	}

	.button-reset {
		color: var(--white);
		text-transform: uppercase;
		font-weight: 900;
		letter-spacing: 1px;
	}

	.menu {
		position: fixed;
		inset: 0;
		color: var(--white);
		background-color: var(--black);
		width: 100vw;
		height: 100vh;
		justify-content: space-between;
		flex-direction: column;
		z-index: 11;

		nav {
			margin-top: 30vh;
			font-size: var(--font-size-xxl);
			a {
				display: block;
				margin-bottom: 2rem;
			}
		}
		> *:last-child {
			margin: 20px;
		}
	}

	.close-button {
		font-size: 5rem;
		margin: 0;
		position: absolute;
		top: 10px;
		right: 10px;
		display: block;
		line-height: 0.5;
		padding: 0;
	}
</style>
