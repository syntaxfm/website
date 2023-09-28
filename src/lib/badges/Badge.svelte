<span class="badge text-sm">
	<slot />
</span>

<style lang="postcss">
	.badge {
		background: color-mix(in lch, var(--fg), transparent 94%);
		color: var(--fg);
		padding: 2px 4px;
		border-radius: 2px;
	}
</style>
