<script lang="ts">
	import Github from '$assets/github.svg';
	import { enhance } from '$app/forms';
	import { loading } from '$state/loading';
	import { form_action } from '$lib/form_action';

	export let data;
	const { user } = data;
</script>

<section class="content">
	<div class="card">
		<h1 class="h3">Login</h1>
		{#if user}
			<p>Hell yea, You are currently Logged In</p>
			<form use:enhance={form_action({ message: 'Logout ' })} action="/?/logout" method="POST">
				<button class="button" type="submit">Logout</button>
			</form>
		{:else}
			<p>If you are not on the Syntax team, this login will do nothing for you.</p>
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
</section>

<style>
	.content {
		padding: 4rem 0;
	}
	.card {
		max-width: 400px;
		margin: 0 auto;
	}
</style>
