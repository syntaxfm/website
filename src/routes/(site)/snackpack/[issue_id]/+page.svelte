<script lang="ts">
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let frame: HTMLIFrameElement | null = $state(null);

	// Email bodies are tall and their height isn't known until the document (and
	// its images) load, so grow the iframe to fit its content.
	$effect(() => {
		if (!frame) return;
		const el = frame;
		let observer: ResizeObserver | undefined;

		const fit = () => {
			const doc = el.contentDocument;
			if (!doc) return;
			el.style.height = `${doc.documentElement.scrollHeight}px`;
			if (!observer) {
				observer = new ResizeObserver(fit);
				observer.observe(doc.documentElement);
			}
		};

		el.addEventListener('load', fit);
		window.addEventListener('resize', fit);
		fit();

		return () => {
			el.removeEventListener('load', fit);
			window.removeEventListener('resize', fit);
			observer?.disconnect();
		};
	});
</script>

<article class="issue">
	<header class="issue-header">
		<h2 class="h6 issue-subject">{data.title}</h2>
		<p class="fs-caption issue-meta">
			You are viewing the Newsletter Archive. Published {format(
				new Date(data.published_at),
				'EEEE MMM dd, yyyy'
			)}
		</p>
		<a class="issue-back" href={resolve('/snackpack')}>← Back to all issues</a>
	</header>

	<div class="issue-paper">
		<iframe
			bind:this={frame}
			class="issue-frame"
			title={data.title}
			srcdoc={data.html}
			sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
			loading="lazy"
		></iframe>
	</div>
</article>

<style lang="postcss">
	/* The issue presents as a light "printed" document regardless of site theme,
	   so the black wordmark and email always read with contrast (matching Figma). */
	.issue {
		color-scheme: light;
		max-width: 820px;
		margin-inline: auto;
		margin-block: clamp(1.5rem, 4vw, 3rem);
		padding: clamp(1.5rem, 4vw, 2.75rem);
		background-color: var(--c-white);
		background-image: var(--c-bg-grit-light);
		color: var(--c-black);
		display: flex;
		flex-direction: column;
		gap: clamp(1.5rem, 4vw, 2.5rem);
	}

	.issue-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	/* Size comes from the global .h6 / .fs-caption classes (matching the original);
	   these scoped rules only handle spacing and the on-paper colour. */
	.issue-subject {
		margin: 0;
		line-height: 1.2;
	}

	.issue-meta {
		margin: 0;
		color: var(--c-black);
		opacity: 0.6;
	}

	.issue-back {
		color: var(--c-black);
		font-variation-settings: var(--fv-700);
	}

	/* White "paper" the email is printed on: solid black frame, square corners. */
	.issue-paper {
		background: var(--c-white);
		border: 5px solid var(--c-black);
	}

	.issue-frame {
		display: block;
		width: 100%;
		border: 0;
		background: var(--c-white);
		color-scheme: light;
	}
</style>
