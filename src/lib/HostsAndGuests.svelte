<script lang="ts">
	import type { Guest, Host as HostType } from '$server/db/types';
	import Host from './hosts/Host.svelte';

	interface Props {
		guests?: { guest: Guest }[];
		hosts?: HostType[];
	}

	let { guests = [], hosts = [] }: Props = $props();
</script>

<div class="guests-and-hosts">
	{#if guests?.length > 0}
		{#each guests as { guest }}
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
	{/if}
	{#if hosts.length > 0}
		{#each hosts as host}
			<Host
				host={{
					name: host.name || '',
					github: host.username,
					twitter: host.twitter
				}}
			/>
		{/each}
	{:else}
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
	{/if}
</div>

<style lang="postcss">
	.guests-and-hosts {
		margin: 2rem 0;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
</style>
