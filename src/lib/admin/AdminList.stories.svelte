<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import AdminList from './AdminList.svelte';

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
		page_size: 20,
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
					<div class="admin-control-row">
						<label class="admin-field">
							<span>Search shows</span>
							<input type="search" value="svelte" />
						</label>
						<label class="admin-field">
							<span>Status</span>
							<select value="ALL">
								<option value="ALL">All statuses</option>
								<option value="DRAFT">Draft</option>
								<option value="PUBLISHED">Published</option>
							</select>
						</label>
					</div>
				{/snippet}

				{#snippet bulk()}
					<div class="admin-control-row">
						<select aria-label="Bulk status" value="PUBLISHED">
							<option value="PUBLISHED">Publish selected</option>
							<option value="DRAFT">Move selected to draft</option>
						</select>
						<button type="button" data-intent="primary">Apply to selected shows</button>
					</div>
				{/snippet}

				{#snippet action_feedback()}
					<p class="admin-feedback" data-tone="positive" role="status">
						The previous bulk update completed.
					</p>
				{/snippet}

				{#snippet table_head({ all_visible_selected, indeterminate, toggle_all_visible })}
					<th>
						<input
							type="checkbox"
							aria-label="Select all rows on this page"
							checked={all_visible_selected}
							{indeterminate}
							onchange={(event) => {
								const target = event.currentTarget;
								if (!(target instanceof HTMLInputElement)) return;
								toggle_all_visible(target.checked);
							}}
						/>
					</th>
					<th>Show</th>
					<th>Title</th>
					<th>Status</th>
				{/snippet}

				{#snippet table_body({ toggle_selected, is_selected })}
					{#each shows as show (show.id)}
						<tr>
							<td>
								<input
									type="checkbox"
									aria-label={`Select ${show.title}`}
									checked={is_selected(show.id)}
									onchange={(event) => {
										const target = event.currentTarget;
										if (!(target instanceof HTMLInputElement)) return;
										toggle_selected(show.id, target.checked);
									}}
								/>
							</td>
							<td>#{show.number}</td>
							<td>{show.title}</td>
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
		page: 1,
		page_size: 20,
		total_pages: 1,
		on_page_change: fn(),
		visible_ids: []
	}}
>
	{#snippet template(args)}
		<div class="admin">
			<AdminList {...args}>
				{#snippet filters()}
					<label class="admin-field">
						<span>Search shows</span>
						<input type="search" value="no matching title" />
					</label>
				{/snippet}

				{#snippet table_head(_params)}
					<th>Show</th>
					<th>Title</th>
					<th>Status</th>
				{/snippet}

				{#snippet table_body(_params)}{/snippet}

				{#snippet empty()}
					<tr>
						<td colspan="3">No shows match the current filters.</td>
					</tr>
				{/snippet}
			</AdminList>
		</div>
	{/snippet}
</Story>
