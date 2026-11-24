<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		// Header cells
		head: Snippet;
		// Body rows
		children: Snippet;
		is_empty?: boolean;
		// Shown in place of the rows when there are none
		empty?: Snippet;
	}

	let { head, children, is_empty = false, empty }: Props = $props();
</script>

<div class="admin-table-container table-container">
	<table>
		<!-- An empty table says so without column names over nothing -->
		{#if !is_empty}
			<thead>
				<tr>
					{@render head()}
				</tr>
			</thead>
		{/if}
		<tbody>
			{#if is_empty}
				{#if empty}
					{@render empty()}
				{:else}
					<tr>
						<td class="admin-cell-muted">Nothing here.</td>
					</tr>
				{/if}
			{:else}
				{@render children()}
			{/if}
		</tbody>
	</table>
</div>
