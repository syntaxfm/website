<script>
	export let show = {};
</script>

<div class="og-template">
	<div class="text-container">
		<p>{show.title}</p>
	</div>
	<footer>
		<h2>Tasty Web Development Treats</h2>
	</footer>
</div>

<style>
	.og-template {
		background: black;
		color: white;
		height: 100%;
		justify-content: space-between;
	}

	div {
		display: flex;
		flex-direction: column;
	}

	.text-container {
		padding: 40px;
	}

	footer {
		background: oklch(83.77% 0.148 81.72);
		color: black;
	}

	h2 {
		font-weight: 900;
		text-align: center;
		width: 100%;
		padding: 10px;
		align-self: center;
	}
</style>
