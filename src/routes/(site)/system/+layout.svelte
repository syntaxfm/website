<script lang="ts">
	let { children } = $props();
</script>

<nav class="l-margin sticky zone">
	<ul>
		<li><a href="/system/colors">Colors</a></li>
		<li><a href="/system/layout">Layout</a></li>
		<li><a href="/system/typography">Typography</a></li>
		<li><a href="/system/theme">Theme</a></li>
	</ul>
</nav>
{@render children()}
