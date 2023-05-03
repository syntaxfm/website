<script lang="ts">
	import type { User } from '@prisma/client';
	import { getContext } from 'svelte';
	import Github from '$assets/github.svg';
	import DropdownMenu from '$lib/DropdownMenu.svelte';
	import { enhance } from '$app/forms';

	const user = getContext<User | null>('user');
</script>

{#if user}
	<p>{user.username}</p>
	<DropdownMenu>
		<img class="avatar" slot="dropdown-button" src={user.avatar_url} alt="User Avatar" />
		<div slot="dropdown-links">
			<form use:enhance action="/api/logout" method="POST">
				<button type="submit">Logout</button>
			</form>
		</div>
	</DropdownMenu>
{:else}
	<form action="/api/oauth/github" method="GET">
		<button type="submit"
			><img width="20" src={Github} alt="Github Logo" /> Login With Github
		</button>
	</form>
{/if}

<style>
	.avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: solid 2px var(--white);
	}
</style>
