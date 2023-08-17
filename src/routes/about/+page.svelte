<script lang="ts">
	import HostSocialLink from '../../lib/hosts/HostSocialLink.svelte';
</script>

<main style:margin-bottom="2rem">
	<h2>About Syntax</h2>

	<h3 style:margin-bottom="0">Wes Bos</h3>
	<HostSocialLink
		host={{
			name: 'Wes Bos',
			github: 'wesbos',
			twitter: 'wesbos'
		}}
	/>
	<p>
		Wes Bos is a Full Stack developer from Canada. Constantly learning, he creates web development
		courses focused on JavaScript, TypeScript, React, CSS, Node.js and whatever else comes his way.
		Wes is the co-host of the popular Syntax.fm podcast and has taught over half a million people
		JavaScript and has spoken at dozens of conferences around the world.
	</p>

	<h3 style:margin-bottom="0">Scott Tolisnki</h3>
	<HostSocialLink
		host={{
			name: 'Scott Tolinski',
			github: 'stolinski',
			twitter: 'stolinski'
		}}
	/>
	<p>
		Scott Tolinski is the creator of Level Up Tutorials where he has created thousands of free and
		premium web development tutorials. Scott also is the co-host of the popular web development
		podcast, Syntax . In his free time Scott is a dedicated Bboy (breakdancer) & enjoys pushing
		himself athletically through dance, working out and snowboarding. He also enjoys green tea and
		Shaw Brothers Kung Fu movies.
	</p>

	<h3>Kaitlin Bloom</h3>
	<HostSocialLink
		host={{
			name: 'Kaitlin Bloom',
			github: 'kaitlinbloom',
			twitter: 'bl0om'
		}}
	/>
	<p>
		Kaitlin Bloom is a digital marketing generalist with a specific passion for growing companies’
		brand and community. She found herself in the “learn-to-code” industry, which she considers to
		be the sweet spot between tech and helping people, both things that energize her.
	</p>
</main>
