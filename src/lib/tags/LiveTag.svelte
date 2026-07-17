<span class="live-tag">
	<span class="indicator" aria-hidden="true"></span>
	Live
</span>

<style>
	.live-tag {
		--live-tag-font-size: inherit;
		--live-tag-padding: inherit;
		--live-tag-text-transform: inherit;

		display: inline-flex;
		align-items: center;
		gap: var(--pad-small);
		background: var(--c-black);
		border: var(--b-light);
		border-color: var(--c-red);
		border-radius: var(--br-small);
		color: var(--c-red);
		font-size: var(--live-tag-font-size);
		font-variation-settings: var(--fv-800);
		line-height: 1;
		padding: var(--live-tag-padding);
		text-transform: var(--live-tag-text-transform);
	}

	.indicator {
		width: var(--pad-small);
		aspect-ratio: 1;
		background: var(--c-red);
		border-radius: var(--br-huge);
	}
</style>
