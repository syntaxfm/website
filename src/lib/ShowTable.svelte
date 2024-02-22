<script lang="ts">
	import type { Show } from '@prisma/client';
	import { format } from 'date-fns';

	export let shows: (Show & {
		aiShowNote: {
			id: number;
			show_number: number;
			title: string;
			description: string;
			provider: string;
			topics: {
				id: number;
				name: string;
				showNote: number;
			}[];
		} | null;
	})[];
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>Number</th>
				<th>Title</th>
				<th>Topics</th>
			</tr>
		</thead>
		<tbody>
			{#if shows.length > 0}
				{#each shows as show}
					<tr>
						<td>
							<span class="show-type">
								{#if format(show.date, 'EEE') === 'Mon'}
									Hasty
								{:else if format(show.date, 'EEE') === 'Wed'}
									Tasty
								{:else if format(show.date, 'EEE') === 'Fri'}
									Supper Club
								{/if}
							</span>
							<br />
							{format(show.date, 'EEE MMM d')}</td
						>
						<td><a href="/admin/shows/{show.number}">{show.number} [↗]</a></td>
						<td>
							<a href="/{show.number}" target="_blank">
								{show.title}
								[↗]
							</a>
						</td>
						<td>
							<span class="topics">
								{#each show.aiShowNote?.topics?.slice(0, 5) || [] as topic}
									<span class="topic">{topic.name.startsWith('#') ? '' : '#'}{topic.name}</span>
								{/each}
							</span></td
						>
					</tr>
				{/each}
			{:else}
				<tr>
					<td class="td-full">No shows scheduled, if there should be, please let someone know</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<style lang="postcss">
	tr {
		display: grid;
		align-items: center;
		grid-template-columns: 150px 100px min(550px) 300px;
	}

	.show-type {
		background: var(--yellow);
		color: var(--black);
		font-weight: 500;
		font-size: var(--font-size-xs);
		rotate: 2deg;
		margin-bottom: -4px;
		text-transform: uppercase;
		z-index: 1;
	}
</style>
