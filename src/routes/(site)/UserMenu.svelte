<script lang="ts">
	import Github from '$assets/github.svg';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { enhance } from '$app/forms';
	import { loading } from '$state/loading';
	import { form_action } from '$lib/form_action';
	import type { User } from '@prisma/client';

	interface Props {
		user: User | null;
	}

	let { user }: Props = $props();
</script>

{#if user}
	<DropdownMenu popover_id="user-menu">
		{#snippet button()}
			<img class="avatar" src={user.avatar_url} alt="User Avatar" />
		{/snippet}

		<div>
			<form use:enhance={form_action({ message: 'Logout ' })} action="/?/logout" method="POST">
				<button type="submit">Logout</button>
			</form>
		</div>
	</DropdownMenu>
{:else}
	<a onclick={() => loading.setLoading(true)} href="/api/oauth/github" rel="external">
		<img width="20" src={Github} alt="Github Logo" /> Login With Github</a
	>
{/if}

<style lang="postcss">
	.avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: solid 2px var(--white);
	}
</style>
