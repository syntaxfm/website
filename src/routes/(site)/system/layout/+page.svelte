<section class="layout full">
	<h3>.layout</h3>
	<div class="l-margin col">Left Margin</div>
	<div class="main col">Main</div>
	<div class="sidebar col">Sidebar</div>
	<div class="r-margin col">Right Margin</div>
	<div class="l-margin col">Left Margin</div>
	<div class="content col">Content</div>
	<div class="r-margin col">Right Margin</div>
	<div class="full col">Full</div>
</section>

<section class="layout full">
	<h3>.grid</h3>
	<section class="grid">
		<div class="col"></div>
		<div class="col"></div>
		<div class="col"></div>
		<div class="col"></div>
		<div class="col"></div>
		<div class="col"></div>
	</section>
</section>

<style lang="postcss">
	.layout {
		gap: 48px;
		margin-bottom: 2rem;
	}

	.col {
		background-color: var(--black-3);
		height: 200px;
	}
</style>
