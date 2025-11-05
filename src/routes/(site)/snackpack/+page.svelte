<script lang="ts">
	import { get_newsletter_archive } from '$lib/newsletter/newsletter.remote';
	import NewsletterArchive from '$lib/newsletter/NewsletterArchive.svelte';
	import NewsletterBanner from '$lib/newsletter/NewsletterBanner.svelte';

	let { issues, count } = await get_newsletter_archive();
</script>

<div>
	<NewsletterBanner {count} />

	<div>
		<h2 style="font-size: var(--fs-9)" class="fv-700-i">Past Issues</h2>
		<p class="readable center">
			Wanna see how good our snackpack is? Looking for something mentioned in the past?
		</p>
		<!-- Loop over data.issues -->
		{#if !issues.length}
			<p class="error">Oopsie daisy! Unable to load past issues.</p>
		{/if}
		<ul class="no-list">
			{#each issues as issue}
				<NewsletterArchive title={issue.subject} date={issue.published_at} issue={issue.id} />
			{/each}
		</ul>
	</div>
</div>
