<script lang="ts">
	import NewsletterForm from '$/lib/newsletter/NewsletterForm.svelte';
	import NewsletterLogo from '$lib/newsletter/NewsletterLogo.svelte';
	import { format } from 'date-fns';

	let { data } = $props();
</script>

<main>
	<div>
		<h1 class="h3 lines" id="newsletter-form-label">Syntax Snack Pack</h1>

		<p class="center">
			Wanna be one of the <strong>{data.count}</strong> coolest people in the world?
		</p>
		<div class="newsletter-logo-container">
			<NewsletterLogo></NewsletterLogo>
		</div>
		<NewsletterForm show_logo={false} />
		<div class="center">
			<h2 class="lines">Past Issues</h2>
			<p class="readable center">
				Wanna see how good our snackpack is? Looking for something mentioned in the past?
			</p>
			<!-- Loop over data.issues -->
			{#if !data.issues.length}
				<p class="error">Oopsie daisy! Unable to load past issues.</p>
			{/if}
			<ul>
				{#each data.issues as issue}
					<li>
						<a href="/snackpack/{issue.id}">
							<small class="text-xs">{format(new Date(issue.published_at), 'MMM dd, yyyy')}</small>
							<p>{issue.subject}</p>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</main>

<style lang="postcss">
	p {
		text-wrap: balance;
	}
	ul {
		margin: 2rem 0;
		padding: 0;
		text-align: left;
	}
	li {
		list-style: none;
		border-bottom: 1px solid var(--line);
		&:first-child {
			border-top: 1px solid var(--line);
		}
		p {
			margin: 0;
		}
		a {
			display: grid;
			justify-content: start;
			align-items: center;
			text-decoration: none;
			padding-block: 5px;
			&:hover {
				text-decoration: underline;
			}
		}
	}
	.newsletter-logo-container {
		width: 300px;
		/* center */
		margin: 0 auto;
		margin-top: 2rem;
	}
	.error {
		color: var(--warning);
	}
</style>
