<script lang="ts">
	import { player } from '$state/player';

	const bars = Array.from({ length: 11 }, (v, i) => (i + 1) * 10).map((k) => {
		const decimal = k / 110;
		return {
			integer: `${k}`,
			deci: `${decimal}`,
			vol: `vol${k}`,
			level: `Volume Level ${k}/110`,
			checked: true
		};
	});
</script>

<div class="player__volume">
	<label>LOUDNESS</label>
	<input type="range" name="volume" id="volume" />
</div>

<style>
	.player__volume {
		width: 120px;
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		flex-wrap: wrap;
		flex: 1 0 auto;
	}

	p {
		line-height: 1;
		margin: 0;
	}

	.player__inputs {
		font-size: 0;
	}

	input ~ label {
		background: var(--black-1);
		border-right: 2px solid black;
		display: inline-block;
		width: 8px;
		height: 2.5rem;
		box-shadow: inset 2px 2px 2px #74747433, inset -2px -2px 2px #ffffff33;
		&:hover {
			background: var(--primary);
		}
	}
</style>
