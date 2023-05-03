<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Github from '$assets/github.svg';
</script>

{#if $page.route.id === '/'}
	<h1>Syntax</h1>
{:else}
	<h2>Syntax</h2>
{/if}

<nav>
	<a href="/podcast">Podcast</a>
	<a href="/articles">Articles</a>
	<a href="/video">Video</a>
	<a href="https://swag.syntax.fm">Swag</a>
</nav>

<form action="/api/oauth/github" method="GET">
	<button type="submit"
		><img width="20" src={Github} alt="Github Logo" /> Login With Github
	</button>
</form>
