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
		<p class="h5">Featuring:</p>
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
