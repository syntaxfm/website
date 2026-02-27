<script lang="ts">
</script>

<a
	href="https://madcss.com"
	target="_blank"
	rel="noopener noreferrer"
	class="layout mad-css-banner"
>
	<div class="banner-content">
		<img src="/mad-css-logo2.svg" alt="MadCSS Logo" class="logo" />

		<div class="text-section">
			<h1 class="headline">MadCSS Starts March 6!</h1>
			<h2 class="subtitle">16 Devs Battle for Glory</h2>
			<p class="cta">
				Fill out your bracket today to win over <span class="prize">$2,000 in swag!</span>
			</p>
		</div>
	</div>
</a>

<style lang="postcss">
	.mad-css-banner {
		background: #f1360d;
		width: 100%;
		position: relative;
		overflow: visible;
		padding: 0;
		color: white;
		grid-column: 1 / -1;
		background: #000;
		background-image:
			linear-gradient(to bottom, #00000080, #0000004d),
			url(https://madcss.com/assets/madcss-wide-hGTXblif.jpg);
		background-size: cover, cover;
		background-position: center, center;
		background-repeat: no-repeat, no-repeat;
		mask-image:
			url(/repeating-paper-top.png), url(/paper-stripe-bottom.png), linear-gradient(#000, #000);
		--mask-size: 20px;
		--mask-position: calc(100% + 5px);
		mask-size:
			auto 20px,
			auto var(--mask-size),
			100% 100%;
		mask-position:
			center 0px,
			center var(--mask-position),
			center;
		mask-repeat: repeat-x, repeat-x, no-repeat;
		mask-composite: exclude;
		mask-mode: alpha;
		text-decoration: none;
		display: block;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.logo {
		width: 250px;
		height: auto;

		@media (--below-med) {
			width: 120px;
		}
	}

	.banner-content {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 20px;

		@media (--below-med) {
			padding: 8px;
			gap: 6px;
		}
	}

	.text-section {
		flex: 1;
		display: flex;
		gap: 4px;
		flex-direction: column;

		@media (--below-med) {
			gap: 2px;
		}
		& > * {
			margin: 0;
			line-height: 1;
			background: black;
			width: fit-content;
			padding: 5px;

			@media (--below-med) {
				padding: 2px 4px;
			}
		}
	}

	.headline {
		font-size: 3.5rem;
		font-weight: 900;
		line-height: 0.9;

		@media (--below-med) {
			font-size: 1.5rem;
		}
	}

	.subtitle {
		font-size: 2rem;
		font-weight: 800;

		@media (--below-med) {
			font-size: 0.9rem;
		}
	}

	.cta {
		font-size: 1.2rem;
		margin: 0;

		@media (--below-med) {
			font-size: 0.7rem;
		}
	}

	.prize {
		background: var(--yellow);
		color: black;
		font-weight: 800;
	}
</style>
