<script lang="ts">
	let { data } = $props();
</script>

<h1 class="h3">Account</h1>
{#if data.user}
	<p>Signed in as {data.user.name}</p>
{/if}
<form method="POST" action="/logout">
	<button>Sign out</button>
</form>
