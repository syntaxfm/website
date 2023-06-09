<script lang="ts">
	import type { Guest } from '@prisma/client';
	import twitter from '$assets/twitter.svg';
	import Host from '$lib/hosts/Host.svelte';
	export let guests: Guest[];
</script>

<div class="guests-and-hosts">
	<h5>Hosted By:</h5>
	<div class="featuring">
		<Host
			host={{
				name: 'Wes Bos',
				github: 'wesbos',
				twitter: 'wesbos'
			}}
		/>
		<Host
			host={{
				name: 'Scott Tolinski',
				github: 'stolinski',
				twitter: 'stolinski'
			}}
		/>
	</div>
	{#if guests.length > 0}
		<h5>Featuring:</h5>
		<div class="featuring">
			{#each guests as guest}
				<Host
					host={{
						name: guest.name,
						github: guest?.github,
						twitter: guest?.twitter,
						slug: guest?.name_slug
					}}
					guest={true}
				/>
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	.guests-and-hosts {
		margin: 2rem 0;
		grid-column: start/end;
	}

	figure {
		display: grid;
		gap: 20px;
		grid-template-columns: 70px 1fr;
		margin: 0;
	}

	figure img {
		width: 100%;
		border-radius: 4px;
	}

	h5 {
		font-weight: 600;
		font-style: italic;
		opacity: 0.8;
		margin: 3rem 0 1rem;
	}

	.featuring {
		display: flex;
		gap: 20%;
		margin-bottom: 2rem;
	}

	figcaption p {
		margin: 0;
		margin-bottom: 0.5rem;
	}

	.social-icon {
		width: 20px;
	}
</style>
