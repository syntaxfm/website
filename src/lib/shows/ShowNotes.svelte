<script lang="ts">
	let { show_notes }: { show_notes: string } = $props();
</script>

<div class="show-notes">
	{@html show_notes}
</div>

<style>
	.show-notes {
		display: flex;
		flex-direction: column;
		gap: 16px;
		:global(a) {
			color: var(--fg);
			text-decoration: underline;
			text-decoration-style: solid;
			text-decoration-color: var(--c-primary);
		}
		:global(ul) {
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		:global(li) {
			list-style: none;
			:global(strong) {
				background: var(--c-fg-1);
				border-radius: var(--br-small);
				padding: 2px 4px;
				font-size: var(--fs-1);
				:global(a) {
					text-decoration: none;
				}
			}
		}
	}
</style>
