<script>
	import NewsletterForm from '$lib/NewsletterForm.svelte';
	import NewsletterLogo from '$lib/newsletter/NewsletterLogo.svelte';
	import { format } from 'date-fns';
	export let data;
</script>

<main>
	<div>
		<h1 class="h3 lines">Syntax Snack Pack</h1>

		<p class="center">Wanna be the <strong>{data.count}</strong> coolest person in the world?</p>
		<div class="newsletter-logo-container">
			<NewsletterLogo></NewsletterLogo>
		</div>
		<NewsletterForm show_logo={false}/>
		<div class="center">
			<h2 class="lines">Past Issues</h2>
			<p class="readable center">
				Wanna see how good our snackpack is? Looking for something mentioned in the past?
			</p>
			<!-- Loop over data.issues -->
			<ul>
				{#each data.issues as issue}
					<li>
						<a href="/snackpack/{issue.id}"
							>{issue.subject}
							<small class="text-xs">{format(new Date(issue.published_at), 'MMM dd, yyyy')}</small>
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
	}
	li {
		list-style: none;
		a {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 1rem;
			text-decoration: none;
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
</style>
