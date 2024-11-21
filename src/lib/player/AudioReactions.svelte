<script lang="ts">
	import { player } from '$state/player';
	import { DotLottieSvelte } from '@lottiefiles/dotlottie-svelte';
	import { onMount } from 'svelte';

	interface Reaction {
		id: string;
		timestamp: number;
		type: string;
		isPlaying?: boolean;
		showAnimation?: boolean;
		userIp?: string;
		createdAt: number;
	}

	let reactions: Reaction[] = [];
	let reactionContainer: HTMLElement;
	let userIp: string = '';
	let lastReactionTime = 0;

	onMount(async () => {
		try {
			const response = await fetch('https://api.ipify.org?format=json');
			const data = await response.json();
			userIp = data.ip;
		} catch (error) {
			console.error('Failed to fetch IP:', error);
			userIp = 'unknown';
		}
	});

	$: {
		reactions = reactions.map((reaction) => ({
			...reaction,
			isPlaying: Math.abs(reaction.timestamp - ($player.audio?.currentTime || 0)) < 0.5
		}));
	}

	const REACTION_TYPES = {
		HEART: 'heart',
		LAUGH: 'laugh',
		THUMBSUP: 'thumbsup',
		FIRE: 'fire'
	};

	const REACTION_ANIMATIONS = {
		[REACTION_TYPES.HEART]:
			'https://lottie.host/34670cfb-d0a6-4c66-9b2d-01a1893cf2f6/FdPrWU8P2Q.lottie',
		[REACTION_TYPES.LAUGH]:
			'https://lottie.host/ff1d9006-010f-45a7-b122-0596f9d64c9c/QNv44zJSpn.lottie',
		[REACTION_TYPES.THUMBSUP]:
			'https://lottie.host/dc8fcca8-83c0-4aff-8add-142bd2f9e644/Jtyv9pmW93.lottie',
		[REACTION_TYPES.FIRE]:
			'https://lottie.host/0de1fd7f-2fb3-41ff-aa75-4f678fae8eea/JwzDWFdRd1.lottie'
	};

	function getReactionPosition(timestamp: number) {
		if (!$player.audio?.duration || $player.audio?.duration <= 0) return '0%';
		const position = (timestamp / $player.audio?.duration) * 100;
		return `${Math.min(Math.max(position, 0), 100)}%`;
	}

	function canAddReaction(timestamp: number): boolean {
		const nearbyReaction = reactions.find(
			(reaction) => reaction.userIp === userIp && Math.abs(reaction.timestamp - timestamp) < 10
		);

		return !nearbyReaction;
	}

	function addReaction(type: string) {
		const currentTime = $player.audio?.currentTime || 0;

		if (!canAddReaction(currentTime)) {
			console.log('Please wait before adding another reaction');
			return;
		}

		const newReaction = {
			id: crypto.randomUUID(),
			timestamp: currentTime,
			type,
			isPlaying: false,
			showAnimation: true,
			userIp,
			createdAt: Date.now()
		};

		lastReactionTime = Date.now();
		console.log(`Adding reaction at timestamp: ${newReaction.timestamp}`);
		reactions = [...reactions, newReaction];

		setTimeout(() => {
			reactions = reactions.map((reaction) =>
				reaction.id === newReaction.id ? { ...reaction, showAnimation: false } : reaction
			);
		}, 5000);
	}

	function removeReaction(reactionId: string) {
		const reaction = reactions.find((r) => r.id === reactionId);
		if (reaction?.userIp === userIp) {
			reactions = reactions.filter((r) => r.id !== reactionId);
		}
	}
</script>

<div class="reactions-container" bind:this={reactionContainer}>
	{#each reactions as reaction (reaction.id)}
		<div
			class="reaction-marker"
			style="left: {getReactionPosition(reaction.timestamp)}"
			title="Reaction at {new Date(reaction.timestamp * 1000).toISOString().substr(11, 8)}"
		>
			<button
				aria-label="Reaction at {new Date(reaction.timestamp * 1000).toISOString().substr(11, 8)}"
				class="reaction-wrapper {reaction.userIp === userIp ? 'removable' : ''}"
				on:mouseenter={() => {
					reactions = reactions.map((r) =>
						r.id === reaction.id ? { ...r, showAnimation: true } : r
					);
				}}
				on:mouseleave={() => {
					reactions = reactions.map((r) =>
						r.id === reaction.id ? { ...r, showAnimation: false } : r
					);
				}}
				on:click={() => removeReaction(reaction.id)}
			>
				<div class="reaction-dot"></div>
				<div class="reaction-animation" class:is-playing={reaction.showAnimation}>
					<DotLottieSvelte
						src={REACTION_ANIMATIONS[reaction.type]}
						autoplay={reaction.showAnimation}
						loop={true}
					/>
				</div>
			</button>
		</div>
	{/each}
</div>

<div class="reaction-buttons">
	{#each Object.entries(REACTION_TYPES) as [key, type]}
		<button class="reaction-button" on:click={() => addReaction(type)}>
			<DotLottieSvelte src={REACTION_ANIMATIONS[type]} autoplay={false} playOnHover />
		</button>
	{/each}
</div>

<style>
	.reactions-container {
		position: absolute;
		width: 100%;
		height: 30px;
		bottom: 100%;
		pointer-events: none;
	}

	.reaction-marker {
		position: absolute;
		bottom: 0;
		transform: translateX(-50%);
		z-index: 99;
	}

	.reaction-wrapper {
		position: relative;
		cursor: pointer;
		pointer-events: auto;
		padding: 0;
		background: transparent;
		border: none;
	}

	.reaction-wrapper.removable .reaction-dot {
		background: var(--primary);
	}

	.reaction-wrapper.removable:hover .reaction-dot {
		background: var(--error, red);
	}

	.reaction-dot {
		width: 5px;
		height: 5px;
		background: var(--primary);
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.reaction-animation {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) scale(0);
		transform-origin: bottom center;
		opacity: 0;
		transition: all 0.3s ease;
		width: 40px;
		height: 40px;
		margin-bottom: 8px;
		pointer-events: none;
	}

	.reaction-wrapper:hover .reaction-dot {
		transform: scale(1.5);
	}

	.reaction-animation.is-playing {
		transform: translateX(-50%) scale(1);
		opacity: 1;
	}

	.reaction-buttons {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.reaction-button {
		padding: 4px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		transition: transform 0.2s;
		background: transparent;
	}

	.reaction-button:hover {
		transform: scale(1.1);
	}
</style>
