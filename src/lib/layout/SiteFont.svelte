<script lang="ts">
	import font_url from '$assets/fonts/MDIO-VF.woff2';
	import font_face from '$styles/font.css?inline';
</script>

<!--
	The site font, in the page's head rather than style.css. The preload starts its download with
	the HTML, so text is there from the first paint.

	In development Vite swaps every imported stylesheet in after the page loads. Each time that
	declared the font again the browser loaded it again, and all text went blank for a frame (twice
	on every page load).
-->
<svelte:head>
	<link rel="preload" as="font" type="font/woff2" href={font_url} crossorigin="anonymous" />
	<svelte:element this={"style"}>{font_face}</svelte:element>
</svelte:head>
