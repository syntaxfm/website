<section>
	<p class="lines thrice">Served Fresh Thrice Weekly</p>
	<div>
		<p class="tag length">15m</p>
		<p class="tag day">Monday</p>
		<div>
			<p class="tag">HASTY TREAT</p>
		</div>
		<p class="desc">Quick n' Informative</p>
	</div>
	<div>
		<p class="tag length">60m</p>
		<p class="tag day">Wednesday</p>
		<div>
			<p class="tag">TASTY TREAT</p>
		</div>
		<p class="desc">Deep Dives</p>
	</div>
	<div>
		<p class="tag length">60m</p>
		<p class="tag day">Friday</p>
		<div>
			<p class="tag">SUPPER CLUB</p>
		</div>
		<p class="desc">Industry Experts</p>
	</div>
</section>

<style>
	section {
		--offset: 100px;
		--gap: 2rem;
		border-radius: var(--brad);
		padding: var(--gap);
		gap: var(--gap);
		border-radius: var(--brad);
		margin-bottom: calc(var(--offset) * -1);
		display: grid;

		grid-template-columns: repeat(3, minmax(0, 1fr));
		text-align: center;
		box-shadow: 0 0 1px 5px rgba(255, 255, 255, 0.1);
		color: var(--fg-root);
		background-color: var(--bg-root);
		background-image: url($assets/whitegrit.png);
		background-size: 269px, 30%;
	}
	.tag {
		background: var(--primary);
		color: black;
		font-weight: 900;
		padding: 0.5rem;
		line-height: 1;
		display: block;
		margin: 0;
		display: inline-block;
		mask-image: url('$assets/Grit Mask@2x.png');
		mask-repeat: repeat;
		mask-size: 250px;
		position: relative;
		&.day {
			background: var(--purple);
			color: white;
			font-weight: 500;
			font-size: var(--font-size-xs);
			rotate: 2deg;
			margin-bottom: -4px;
			text-transform: uppercase;
			z-index: 1;
		}
		&.length {
			background: var(--white);
			color: black;
			font-weight: 500;
			font-size: var(--font-size-xs);
			rotate: -1deg;
			margin-bottom: -4px;
			z-index: 1;
		}
	}
	.desc {
		font-size: var(--font-size-xs);
	}
	.thrice {
		text-transform: uppercase;
		grid-column: 1 / -1;
		margin: 0;
		letter-spacing: 3px;
		font-size: var(--font-size-sm);
	}
</style>
