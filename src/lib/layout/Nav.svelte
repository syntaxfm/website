<script>
	import Icon from '../Icon.svelte';

	const LINKS = [
		['/shows', 'Shows'],
		['/about', 'About'],
		['/newsletter', 'Newsletter'],
		['/potluck', 'Potluck Qs'],
		['https://sentry.shop/collections/syntax', 'Shows']
	];
</script>

<nav>
	<ul>
		{#each LINKS as [href, text]}
			<li>
				<a {href}>{text}</a>
			</li>
		{/each}
		<li>
			<button><Icon name="search" />Search</button>
		</li>
	</ul>
</nav>

<style>
	nav ul {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 24px;
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
				background: var(--c-shade-or-tint);
				padding: 10px 18px 8px;
				border-radius: var(--br-huge);
				color: var(--c-fg);
				transition: background 0.2s ease-in-out;

				&:hover {
					background: var(--c-shade-or-tint-light);
				}
			}
		}
	}
</style>
