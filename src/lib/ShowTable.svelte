<script lang="ts">
	import type { Show } from '$server/db/types';
	import { format } from 'date-fns';

	interface Props {
		shows: (Show & {
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
	}

	let { shows }: Props = $props();
</script>

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>Title</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#if shows.length > 0}
				{#each shows as show}
					<tr>
						<td>{format(show.date, 'E MMM d')}</td>
						<td>
							<a href="/{show.number}" target="_blank">
								{show.number}
								{show.title}
								[↗]
							</a>
						</td>
						<td><a href="/admin/content/podcast/{show.number}">Edit</a></td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="42">No shows scheduled, if there should be, please let someone know</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
