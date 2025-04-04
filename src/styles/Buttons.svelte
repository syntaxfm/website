<div>
	<button>Basic Button</button>
	<a class="button" href="https://tolin.ski">Link Button</a>
	<button class="graphic">Tilted Button</button>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
		& > * {
			flex-grow: 0;
		}
	}
</style>
