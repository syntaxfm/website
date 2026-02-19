<script>
	import { search } from '$state/search.svelte';
	import Icon from '../Icon.svelte';

	const LINKS = [
		['/shows', 'Shows'],
		['/about', 'About'],
		['/snackpack', 'Newsletter'],
		['/potluck', 'Potluck Qs'],
		['https://sentry.shop/collections/syntax', 'Shop']
	];
</script>

<nav>
	<ul>
		{#each LINKS as [href, text] (href)}
			<li>
				<a {href}>{text}</a>
			</li>
		{/each}
		<li>
			<button
				onclick={() => {
					search.searching = true;
				}}><Icon name="search" />Search</button
			>
		</li>
	</ul>
</nav>

<style>
	nav ul {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		padding: 0;

		& li {
			list-style: none;

			& a,
			button {
				font-size: var(--fs-2);
				display: flex;
				flex-wrap: nowrap;
				align-items: center;
				gap: 10px;
				text-decoration: none;
				background: var(--c-fg-1);
				padding: 10px 18px 8px;
				border-radius: var(--br-huge);
				color: var(--c-fg);
				transition: background 0.2s ease-in-out;

				&:hover {
					background: var(--c-fg-05);
				}
			}
		}
	}
</style>
