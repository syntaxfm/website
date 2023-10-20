<script lang="ts">
	import underConstruction from '$assets/under-construction.gif';
</script>

<div>
	<img src={underConstruction} alt="Cute lil digger on a under construction sign" />
	<p>
		New site, mind the dust! Please <a href="https://github.com/syntaxfm/website/issues"
			>log any issues or suggestions</a
		>
	</p>
</div>

<style lang="postcss">
	div {
		color: var(--white);
		display: flex;
		gap: 20px;
		align-items: center;
		justify-content: center;
	}
	img {
		height: 30px;
		filter: sepia(99%) saturate(1726%) hue-rotate(323deg);
	}
	p {
		font-size: var(--font-size-sm);
	}
</style>
