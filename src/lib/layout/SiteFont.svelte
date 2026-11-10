<script lang="ts">
	import font_url from '$assets/fonts/MDIO-VF.woff2';
	import font_face from '$styles/font.css?inline';

	// The tag name is spelled this way so Svelte doesn't take it for this component's own styles
	const font_style = `<${'style'}>${font_face}</${'style'}>`;
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
	<!--
		Raw HTML so the browser keeps the server's copy as it is. A built page spells the font's URL
		differently in the browser, and rewriting the rule would load the font again.
	-->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own stylesheet, built by Vite -->
	{@html font_style}
</svelte:head>
