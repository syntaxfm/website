<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import AdminDateRange from './AdminDateRange.svelte';
	import AdminFilterMenu from './AdminFilterMenu.svelte';
	import AdminList from './AdminList.svelte';
	import AdminSearch from './AdminSearch.svelte';
	import AdminTitleCell from './AdminTitleCell.svelte';
	import { to_filter_options } from './admin_filters.ts';

	interface ShowRow {
		id: string;
		number: number;
		title: string;
		status: 'Draft' | 'Published';
	}

	const shows: ShowRow[] = [
		{
			id: 'show-842',
			number: 842,
			title: 'The State of JavaScript Tooling and the Modern Web Platform',
			status: 'Published'
		},
		{
			id: 'show-843',
			number: 843,
			title: 'Type-Safe APIs from Database to Browser',
			status: 'Draft'
		},
		{
			id: 'show-844',
			number: 844,
			title: 'Accessible Components without Compromising the Design',
			status: 'Draft'
		}
	];

	const STATUS_OPTIONS = to_filter_options(['DRAFT', 'PUBLISHED']);

	const { Story } = defineMeta({
		title: 'Admin/List',
		component: AdminList
	});
</script>

<Story
	name="Filters Bulk and Pagination"
	args={{
		total: 48,
		page: 2,
		total_pages: 3,
		on_page_change: fn(),
		selected_ids: ['show-842'],
		visible_ids: shows.map((show) => show.id)
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<AdminList {...args}>
				{#snippet filters()}
					<AdminSearch text="svelte" />
					<AdminDateRange from="" to="" onchange={fn()} />
					<AdminFilterMenu label="Status" options={STATUS_OPTIONS} onselect={fn()} />
				{/snippet}

				{#snippet bulk()}
					<AdminFilterMenu label="Set status" options={STATUS_OPTIONS} onselect={fn()} />
				{/snippet}

				{#snippet table_head()}
					<th>Show</th>
					<th>Title</th>
					<th>Status</th>
				{/snippet}

				{#snippet table_body({ select_cell })}
					{#each shows as show (show.id)}
						<tr>
							{@render select_cell(show.id, show.title)}
							<td>#{show.number}</td>
							<AdminTitleCell title={show.title} edit_href="#" public_href="#" />
							<td>{show.status}</td>
						</tr>
					{/each}
				{/snippet}
			</AdminList>
		</div>
	{/snippet}
</Story>

<Story
	name="Empty"
	args={{
		total: 0,
		visible_ids: []
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<AdminList {...args}>
				{#snippet filters()}
					<AdminSearch text="no matching title" />
				{/snippet}

				{#snippet table_head()}
					<th>Show</th>
					<th>Title</th>
					<th>Status</th>
				{/snippet}

				{#snippet table_body()}{/snippet}

				{#snippet empty()}
					<tr>
						<td colspan="3">No shows match the current filters.</td>
					</tr>
				{/snippet}
			</AdminList>
		</div>
	{/snippet}
</Story>
