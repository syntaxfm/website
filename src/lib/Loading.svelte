<script lang="ts">
	import { loading } from '$state/loading';
	import { fade } from 'svelte/transition';
	import Logo from '$assets/logo.svg';
</script>

{#if $loading.status === 'LOADING'}
	<div transition:fade class="loader">
		<div>
			<img src={Logo} alt="Syntax Logo" />
			<h3>Loading</h3>
		</div>
	</div>
{/if}

<style>
	.loader {
		z-index: 10;
		position: fixed;
		background: #000000ee;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loader svg {
		width: 150px;
		height: 150px;
		margin: 0 auto;
	}
</style>
