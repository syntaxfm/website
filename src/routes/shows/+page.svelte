<script lang="ts">
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import Icon from '$lib/Icon.svelte';
	import SelectMenu from '$lib/SelectMenu.svelte';
	import ShowCard from '$lib/ShowCard.svelte';
	import type { PageData } from './$types';

	let sort = 'nto';
	export let data: PageData;
	$: ({ shows } = data);
</script>

<section>
	<div class="list-heading">
		<h3>All Episodes</h3>

		<div>
			<DropdownMenu>
				<button class="subtle" slot="dropdown-button">
					<Icon name="filter" /> Episode Type
				</button>
				<div slot="dropdown-links" class="dropdown-links">
					<a class="button" href="?order=desc" class:active={sort === 'nto'}>Hast</a>
					<a class="button" href="?order=asc" class:active={sort === 'otn'}>Tasty</a>
					<a class="button" href="?order=asc" class:active={sort === 'otn'}>Supper Club</a>
					<a class="button" href="?order=asc" class:active={sort === 'otn'}>Special</a>
				</div>
			</DropdownMenu>

			<SelectMenu
				options={[
					{ value: 'desc', label: 'Newest To Oldest' },
					{ value: 'asc', label: 'Oldest To Newest' }
				]}
			>
				<button type="button" class="subtle" slot="dropdown-button">
					<Icon name="sort" /> Sort Episodes
				</button>
				<div slot="dropdown-links" class="dropdown-links">
					<option class="button" value="desc" class:active={sort === 'nto'}>Newest To Oldest</option
					>
					<option class="button" value="asc" class:active={sort === 'otn'}>Oldest To Newest</option>
				</div>
			</SelectMenu>
		</div>
	</div>
	{#each shows as show (show.id)}
		<ShowCard {show} display="list" />
	{/each}
</section>

<style>
	.list-heading {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.dropdown-links {
		display: flex;
		justify-content: flex-end;
		flex-direction: column;
		padding: 1rem;
		gap: 10px;
	}

	h3 {
		view-transition-name: var(--transition-name);
	}
</style>
