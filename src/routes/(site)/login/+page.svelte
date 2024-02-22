<script lang="ts">
	import Github from '$assets/github.svg';
	import { enhance } from '$app/forms';
	import { loading } from '$state/loading';
	import { form_action } from '$lib/form_action';

	export let data;
	const { user } = data;
</script>

<div class="card">
	{#if user}
		<h4>Hell yea, You are currently Logged In</h4>
		<form use:enhance={form_action({ message: 'Logout ' })} action="/?/logout" method="POST">
			<button class="button" type="submit">Logout</button>
		</form>
	{:else}
		<a
			class="button subtle"
			on:click={() => loading.setLoading(true)}
			href="/api/oauth/github"
			rel="external"
		>
			<img width="20" src={Github} alt="Github Logo" /> Login With Github</a
		>
	{/if}
</div>
