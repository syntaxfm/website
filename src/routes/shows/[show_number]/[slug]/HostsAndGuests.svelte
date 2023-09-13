<script lang="ts">
	import type { Guest } from '@prisma/client';
	import Host from '$lib/hosts/Host.svelte';
	export let guests: { Guest: Guest }[] = [];
</script>

<div class="guests-and-hosts">
	<p style="h5">Hosted By:</p>
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
	{#if guests?.length > 0}
		<p style="h5">Featuring:</p>
		<div class="featuring">
			{#each guests as { Guest }}
				<Host
					host={{
						name: Guest.name,
						github: Guest?.github,
						twitter: Guest?.twitter,
						slug: Guest?.name_slug
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
	}

	h5 {
		font-weight: 600;
		font-style: italic;
		opacity: 0.8;
		margin: 0 0 1rem;
	}

	.featuring {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 2rem;
		@media (--above_med) {
			gap: 60px;
		}
	}
</style>
