<script lang="ts">
	import TagRow from '../tags/TagRow.svelte';
	import SidebarTitle from './SidebarTitle.svelte';

	// TODO: Replace with actual trending topics
	let tags = $state([
		'NextJS',
		'Svelte',
		'TailwindCSS',
		'TypeScript',
		'React',
		'Vue',
		'Svelte',
		'TailwindCSS',
		'TypeScript',
		'React',
		'Vue',
		'Vite',
		'Git',
		'Docker',
		'GraphQL',
		'React',
		'Vue',
		'Vite',
		'Git',
		'Docker',
		'GraphQL',
		'DevTools'
	]);
</script>

<div>
	<SidebarTitle title="_TRENDING_TOPICS()" />
	<TagRow {tags} />
</div>
