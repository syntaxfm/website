<script lang="ts">
	import { get_newsletter_archive } from '$lib/newsletter/newsletter.remote';
	import NewsletterArchive from '$lib/newsletter/NewsletterArchive.svelte';
	import NewsletterBanner from '$lib/newsletter/NewsletterBanner.svelte';
	import NewsletterPromo from '$lib/newsletter/NewsletterPromo.svelte';
	import Icon from '$lib/Icon.svelte';

	let { issues, count } = await get_newsletter_archive();
</script>

<NewsletterBanner {count} />
<NewsletterPromo />

<section class="past-issues">
	<header class="past-issues-header">
		<h2 class="title fv-700-i">
			Past Issues!
			<span class="cat"><Icon name="cat" width="0.85em" height="0.85em" /></span>
		</h2>
		<p class="subhead">
			Wanna see how good our snackpack is? Looking for something mentioned in the past?
		</p>
	</header>

	{#if !issues.length}
		<p class="error">Oopsie daisy! Unable to load past issues.</p>
	{/if}

	<ul class="no-list issue-list">
		{#each issues as issue (issue.id)}
			<li>
				<NewsletterArchive
					id={issue.id}
					issue_number={issue.issue_number}
					title={issue.title}
					date={issue.published_at}
				/>
			</li>
		{/each}
	</ul>
</section>

<style lang="postcss">
	.past-issues {
		container: past-issues / inline-size;
		max-width: 1000px;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		gap: clamp(2rem, 5cqi, 3rem);
		padding-block: clamp(3rem, 7cqi, 4.5rem);
	}

	.past-issues-header {
		display: flex;
		flex-direction: column;
		gap: var(--pad-small);
	}

	.title {
		font-size: clamp(var(--fs-6), 5cqi, var(--fs-9));
		line-height: 1.1;
	}

	.cat {
		display: inline-block;
		vertical-align: -0.08em;
		rotate: 12deg;
	}

	.subhead {
		max-width: 44ch;
		margin: 0;
		font-size: clamp(var(--fs-3), 2.4cqi, var(--fs-5));
	}

	.issue-list {
		display: flex;
		flex-direction: column;
		gap: clamp(2rem, 5cqi, 3rem);
	}

	.issue-list li {
		list-style: none;
	}

	.error {
		color: var(--c-red);
	}
</style>
