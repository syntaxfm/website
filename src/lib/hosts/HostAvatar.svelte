<script lang="ts">
	export let host: {
		name: string;
		github: string;
		twitter: string;
		slug?: string;
	};
</script>

<img src={`https://github.com/${host.github}.png`} alt={host.name} class="avatar"/>

<style>
	img {
		width: 100%;
		border-radius: 4px;
	}
</style>