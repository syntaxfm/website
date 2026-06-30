<script lang="ts">
	import syntaxLogo from '../assets/syntax-wordmark-wide.svg';
</script>

<a href="https://syntax.fm/meetup" target="_blank" class="layout amsterdam-banner">
	<div class="banner-content">
		<div class="text-section">
			<p class="top-line">
				<img src={syntaxLogo} alt="Syntax" class="syntax-logo" />
				<img src="/js-nation-logo.png" alt="JS Nation" class="js-logo" />
			</p>
			<h2 class="title">AMSTERDAM MEETUP</h2>
			<p class="date">JUNE 10TH &nbsp;6-9PM</p>
		</div>
	</div>
</a>

<style lang="postcss">
	.amsterdam-banner {
		width: 100%;
		position: relative;
		overflow: hidden;
		padding: 0;
		color: var(--white);
		grid-column: 1 / -1;

		--banner-bg: #e91e8c;

		background-color: var(--banner-bg);
		background-image: url('/amsterdam-canal.webp');
		background-size: auto 100%;
		background-position: right center;
		background-repeat: no-repeat;
		mask-image:
			url('/repeating-paper-top.png'), url('/paper-stripe-bottom.png'),
			linear-gradient(var(--black), var(--black));

		--mask-size: 20px;
		--mask-position: calc(100% + 5px);

		mask-size:
			auto 20px,
			auto var(--mask-size),
			100% 100%;
		mask-position:
			center 0,
			center var(--mask-position),
			center;
		mask-repeat: repeat-x, repeat-x, no-repeat;
		mask-composite: exclude;
		mask-mode: alpha;
		text-decoration: none;
		display: block;
		cursor: pointer;

		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(to right, var(--banner-bg) 0%, transparent 15%);
			pointer-events: none;
		}
	}

	.banner-content {
		position: relative;
		z-index: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px 20px;

		@media (--below-med) {
			padding: 20px 12px;
		}
	}

	.text-section {
		display: flex;
		flex-direction: column;
		gap: 0;
		text-shadow: 3px 3px var(--black);
	}

	.top-line {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		line-height: 1;
	}

	.syntax-logo {
		height: 2.8rem;
		width: auto;

		@media (--below-med) {
			height: 1.1rem;
		}
	}

	.js-logo {
		height: 2.6rem;
		width: auto;

		@media (--below-med) {
			height: 1rem;
		}
	}

	.title {
		margin: 4px 0 0;
		line-height: 0.95;
		font-size: var(--font-size-xxxl);
		font-weight: 900;
		color: var(--yellow);
	}

	.date {
		margin: 4px 0 0;
		font-size: var(--font-size-xxl);
		font-weight: 800;
		color: var(--white);
		line-height: 1;
	}
</style>
