<script>
	import Logo from './Logo.svelte';
</script>

<div class="presented">
	<div class="cred">
		<Logo height={35} />
		<span>×</span>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 44" height="35px"
			><path
				d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z"
				fill="white"
			></path></svg
		>
		<span>Syntax is Produced by Sentry</span>
	</div>

	<p class="readable">
		Nearly 4M developers and 90K organizations rely on Sentry to see what actually matters, solve
		what's urgent faster, and learn continuously about their code.
	</p>
	<a
		href="https://sentry.io/welcome/?utm_medium=site&utm_source=syntax&utm_campaign=syntax-sentry-evergreen&utm_content=footer"
		class="button ghost">Try Sentry for Free</a
	>
</div>

<div class="bg-indigo-600 bg-opacity-25"></div>

<style>
	.cred {
		display: flex;
		gap: 0.69rem;
		align-items: center;
		font-size: 22px;
		font-weight: 500;
	}
	.presented {
		box-shadow: inset 0 0 0 4px rgb(from black r g b / 0.2);
		border-radius: var(--brad);
		padding: 1rem;
		margin: 2rem 0;
		background: var(--sentry-footer-bg);
		background-blend-mode: hard-light;
		background-size:
			300px 300px,
			cover;
		margin-inline: auto;
		max-width: none;
	}

</style>
