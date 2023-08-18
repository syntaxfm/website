<script lang="ts">
	import HostSocialLink from './HostSocialLink.svelte';
	import HostAvatar from './HostAvatar.svelte';
	export let guest: boolean = false;
	export let host: {
		name: string;
		github: string;
		twitter: string;
		slug?: string;
	};
</script>

<figure>
	<HostAvatar host={host}/>
	<figcaption>
		<p>
			{#if guest}
				<a href={`/guest/${host.slug}`}>{host.name}</a>
			{:else}
				{host.name}
			{/if}
		</p>
		<div class="featuring_socials">
			<HostSocialLink {host} />
		</div>
	</figcaption>
</figure>

<style>
	figure {
		display: grid;
		gap: 20px;
		grid-template-columns: 70px 1fr;
		margin: 0;
	}

	figure img {
		width: 100%;
		border-radius: 4px;
	}

	figcaption p {
		margin: 0;
		margin-bottom: 0.5rem;
		white-space: nowrap;
	}
</style>
