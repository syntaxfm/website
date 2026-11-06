<script lang="ts">
	import FacePile from '#lib/hosts/FacePile.svelte';
	import { get_faces_from_show, type FaceShow } from './hosts_utils';

	const { show }: { show: FaceShow } = $props();

	let faces = get_faces_from_show(show);
	let guest = faces.filter((face) => face.type === 'guest')[0];
</script>

<div>
	<FacePile size="60px" {faces} />
	<p>
		With {#if guest}
			Special Guest
			<br />
			{guest.name}
		{:else}
			Hosts
			<br />
			{faces.map((face) => face.name.split(' ')[0]).join(' & ')}
		{/if}
	</p>
</div>

<style>
	div {
		display: flex;
	}
</style>
