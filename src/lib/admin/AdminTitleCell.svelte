<script lang="ts">
	import Icon from '#lib/Icon.svelte';

	interface Props {
		title: string;
		// The admin editor; the title links there
		edit_href?: string | null;
		// Where it lives in public (site or YouTube), opened from an icon
		public_href?: string | null;
		image?: string | null;
		// A muted second line, such as an email
		detail?: string | null;
	}

	let { title, edit_href, public_href, image, detail }: Props = $props();
</script>

<td class="admin-cell-title">
	{#if image}
		<img src={image} alt="" width="96" height="54" loading="lazy" />
	{/if}
	{#if edit_href}
		<a href={edit_href}>{title}</a>
	{:else}
		{title}
	{/if}
	{#if public_href}
		<a
			class="admin-link-out"
			href={public_href}
			target="_blank"
			rel="noopener noreferrer external"
			aria-label={`Open ${title} in public`}
		>
			<Icon name="link-out" />
		</a>
	{/if}
	{#if detail}
		<small title={detail}>{detail}</small>
	{/if}
</td>
