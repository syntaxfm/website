<script lang="ts">
	import SyntaxKeyboard from '#lib/SyntaxKeyboard.svelte';
</script>

<div class="layout keyboard-banner">
	<div class="banner-content">
		<div class="text-section">
			<h2 class="title">
				<a href="https://keyboard.syntax.fm" target="_blank" rel="noopener noreferrer"
					>Program your<br />Syntax Keyboard &rarr;</a
				>
			</h2>
		</div>
		<SyntaxKeyboard class="keyboard" />
	</div>
</div>

<style lang="postcss">
	.keyboard-banner {
		width: 100%;
		position: relative;
		overflow: hidden;
		padding: 0;
		color: var(--white);
		grid-column: 1 / -1;
		--band-pad: 60px;
		--hang: 88px;
		--banner-bg: #e91e8c;
		display: block;

		@media (--below-med) {
			--band-pad: 16px;
			--hang: 12px;
		}

		&::before {
			content: '';
			position: absolute;
			inset: 0 0 var(--hang);
			background-color: var(--banner-bg);
			mask-image:
				url(/repeating-paper-top.png), url(/paper-stripe-bottom-cutout.png),
				linear-gradient(var(--black), var(--black));
			mask-size:
				auto 20px,
				auto 20px,
				100% calc(100% - 19px);
			mask-position:
				center 0,
				center 100%,
				center 0;
			mask-repeat: repeat-x, repeat-x, no-repeat;
			mask-composite: exclude, add;
			mask-mode: alpha;
		}
	}

	.banner-content {
		position: relative;
		width: fit-content;
		margin: 0 auto;
		padding: var(--band-pad) 20px calc(var(--band-pad) + var(--hang));

		@media (--below-med) {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 0 12px calc(var(--band-pad) + var(--hang));
		}
	}

	.text-section {
		position: relative;
		z-index: 1;
		margin-left: 460px;
		text-shadow: 3px 3px var(--black);

		@media (--below-med) {
			margin-left: 0;
			text-align: center;
		}
	}

	.title {
		margin: 0;
		line-height: 0.95;
		padding: 0 0.15em 0.15em;
		font-size: var(--font-size-lg);
		font-weight: 900;
		color: var(--yellow);

		a {
			color: inherit;
			text-decoration: none;
		}
	}

	.banner-content :global(.keyboard) {
		position: absolute;
		left: 20px;
		bottom: 18px;
		width: 420px;
		height: auto;
		rotate: 4deg;
		filter: drop-shadow(0 12px 18px rgb(0 0 0 / 0.6));
		transition: translate 0.2s ease;
		animation: drop-in 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) both;

		@media (--below-med) {
			position: relative;
			left: auto;
			bottom: auto;
			order: -1;
			width: 280px;
			margin: -40px 0 12px;
		}
	}

	@keyframes drop-in {
		from {
			transform: translateY(-100%);
		}
	}

	.keyboard-banner:has(.title a:hover) :global(.keyboard) {
		translate: 0 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.banner-content :global(.keyboard) {
			transition: none;
			animation: none;
		}
	}
</style>
