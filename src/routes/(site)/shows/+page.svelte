<script lang="ts">
	import ShowBox from '$lib/shows/ShowBox.svelte';
</script>

<section class="stack">
	<h1 class="fv-700-i">All Shows</h1>
	<p style="line-height: 1.5;" class="h4">
		<span class="fv-700-i">From deep technical breakdowns to hands-on coding guides,</span> our shows
		cover everything a modern developer needs. Whether you're into web development, emerging tech, or
		practical tutorials, you'll find fresh insights and expert discussions across our lineup. Browse
		the shows, find your favorites, and start learning today!
	</p>

	<div class="stack">
		<ShowBox
			name={'The Syntax Podcast'}
			intro=", hosted by Scott Tolinski and Wes Bos, is your go-to resource for all things web development.
		Covering everything from cutting-edge frameworks to career tips, Scott and Wes bring their
		expertise, humor, and fresh perspectives to every episode. Whether you're a seasoned developer
		or just starting out, Syntax has something for you!"
			button_text="Check it out!"
			image="/shows/syntax-podcast.jpg"
			link="/shows/syntax-podcast"
		/>
	</div>
</section>
