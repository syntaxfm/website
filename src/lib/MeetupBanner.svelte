<script lang="ts">
	import syntax_logo from '$assets/syntax-wordmark-wide.svg';
</script>

<a
	href="https://syntax.fm/meetup"
	target="_blank"
	rel="noopener noreferrer"
	class="layout meetup-banner"
>
	<div class="banner-content">
		<div class="text-section">
			<p class="top-line">
				<img src={syntax_logo} alt="Syntax" class="syntax-logo" />
			</p>
			<h2 class="title">SAN FRANCISCO MEETUP</h2>
			<p class="date">OCT 27TH &nbsp;5-7PM</p>
		</div>
	</div>
</a>

<style lang="postcss">
	.meetup-banner {
		width: 100%;
		position: relative;
		overflow: hidden;
		padding: 0;
		color: var(--c-white);
		grid-column: 1 / -1;

		--banner-bg: var(--c-pink);

		background-color: var(--banner-bg);
		background-image: url('https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=85,width=1200,height=1200/uploads/gg/edf698e2-7bbd-4dce-9b9a-67268ba7f00c.jpg');
		background-size: auto 100%;
		background-position: right center;
		background-repeat: no-repeat;
		mask-image:
			url('/repeating-paper-top.png'), url('/paper-stripe-bottom.png'),
			linear-gradient(var(--c-black), var(--c-black));

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
		text-shadow: 3px 3px var(--c-black);
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

	.title {
		margin: 4px 0 0;
		line-height: 0.95;
		font-size: var(--fs-9);
		font-weight: 900;
		color: var(--c-yellow);
	}

	.date {
		margin: 4px 0 0;
		font-size: var(--fs-8);
		font-weight: 800;
		color: var(--c-white);
		line-height: 1;
	}
</style>
