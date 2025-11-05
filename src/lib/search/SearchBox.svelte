<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { search } from '$state/search.svelte';
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import SearchWorker from './search-worker.js?worker';
	import SearchResults from './SearchResults.svelte';
	import SearchResultList from './SearchResultList.svelte';
	import { fade } from 'svelte/transition';
	import { clickOutDialog } from '$actions/click_outside_dialog';
	import type { Block, Tree } from './types';
	import type { Show } from '$server/db/schema';

	let search_input: HTMLInputElement = $state(null!);
	let modal: HTMLDialogElement = $state(null!);
	let local_search: {
		results: Tree[];
		query: string;
	} | null = $state(null);
	let recent_searches: (Block & Show)[] = $state([]);

	let worker: Worker | null = null;
	let ready = $state(false);
	let active_color = $state('var(--c-fg)');

	let uid = 0;
	const pending = new SvelteSet<number>();

	//Initialize worker once on mount
	$effect(() => {
		const w = new SearchWorker();
		worker = w;

		w.addEventListener('message', (event) => {
			const { type, payload } = event.data;
			if (type === 'ready') {
				ready = true;
			} else if (type === 'results') {
				local_search = payload;
			} else if (type === 'recents') {
				recent_searches = payload;
			}
		});

		w.postMessage({
			type: 'init',
			payload: {
				origin: location.origin
			}
		});

		search_input?.focus();

		return () => {
			w.terminate();
		};
	});

	// Send search query to worker when ready or query changes
	$effect(() => {
		if (ready && worker) {
			const id = ++uid;
			pending.add(id);
			worker.postMessage({ type: 'query', id, payload: search.search_query });
		}
	});

	// Send recent searches to worker when ready or recent list changes
	$effect(() => {
		if (ready && worker) {
			worker.postMessage({
				type: 'recents',
				payload: $state.snapshot(search.search_recent.value)
			});
		}
	});

	// Sync overlay state with searching state
	$effect(() => {
		tick().then(() => {
			search.overlay_open = search.searching;
		});
	});

	// Show/hide modal based on searching state
	$effect(() => {
		if (search.searching && modal) {
			search.overlay_open = true;
			modal.showModal();
		}
	});

	afterNavigate(() => {
		close();
	});

	async function close() {
		if (modal) {
			modal.close();
		}
		if (search.searching) {
			search.searching = false;
		}
		local_search = null;
	}

	function navigate(href: string) {
		// search.search_recent.value = (recent: string[]) => [href, ...recent.filter((x) => x !== href)];
		close();
	}

	function change_color(e: MouseEvent) {
		if (e.target instanceof Element) {
			const computed = window.getComputedStyle(e.target).backgroundColor;
			active_color = computed;
		}
	}

	function search_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.isComposing) {
			const anchor: HTMLAnchorElement | null = modal?.querySelector('a[data-has-node]');
			if (anchor) {
				anchor.click();
			}
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'k' && (navigator.platform === 'MacIntel' ? e.metaKey : e.ctrlKey)) {
			e.preventDefault();
			search.search_query = '';

			if (search.searching) {
				close();
			} else {
				search.searching = true;
			}
		}

		if (e.code === 'Escape') {
			close();
		}
	}}
/>

<dialog
	bind:this={modal}
	class="zone"
	style:--c-bg="var(--c-bg)"
	style:--c-fg="var(--c-fg)"
	use:clickOutDialog
	onclick-outside={close}
	aria-labelledby="search-header"
>
	<section aria-label="Search Results Window">
		<header role="banner">
			<input
				bind:this={search_input}
				onkeydown={search_keydown}
				oninput={(e) => {
					search.search_query = e.currentTarget.value;
				}}
				value={search.search_query}
				placeholder="Search"
				aria-describedby="search-description"
				aria-label="Search"
				spellcheck="false"
				class="search-input"
			/>

			<button class="close" onclick={close} type="submit">×</button>
		</header>
		<div class="results">
			{#if local_search?.query}
				<div transition:fade={{ duration: 300 }}>
					<SearchResults
						results={local_search.results}
						query={local_search.query}
						onselect={(href) => {
							close();
							navigate(href);
						}}
					/>
				</div>
			{:else}
				<div transition:fade={{ duration: 100 }} class="recent-searches">
					<div>
						<!-- prettier-ignore -->
						<pre style:color={active_color} style="overflow: hidden; width: 201px;">
░██████╗██╗░░░██╗███╗░░██╗
██╔════╝╚██╗░██╔╝████╗░██║
╚█████╗░░╚████╔╝░██╔██╗██║
░╚═══██╗░░╚██╔╝░░██║╚████║
██████╔╝░░░██║░░░██║░╚███║
╚═════╝░░░░╚═╝░░░╚═╝░░╚══╝

████████╗░█████╗░██╗░░██╗
╚══██╔══╝██╔══██╗╚██╗██╔╝
░░░██║░░░███████║░╚███╔╝░
░░░██║░░░██╔══██║░██╔██╗░
░░░██║░░░██║░░██║██╔╝╚██╗
░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝
					</pre>
						<div class="color-boxes">
							{#each Array(12) as _, i (i)}
								<button aria-label={`ASCII Color ${i + 1}`} onclick={change_color}></button>
							{/each}
						</div>
					</div>
					<div>
						<h2 class="h5" id="search-header" class:empty={recent_searches.length === 0}>
							Recent searches
						</h2>
						{#if !recent_searches.length}
							<p>No recent searches</p>
						{/if}

						{#if recent_searches.length}
							<SearchResultList
								results={recent_searches}
								recent_searches={true}
								query={local_search?.query || ''}
								on:select={(e) => {
									close();
									navigate(e.detail.href);
								}}
							/>
						{/if}
					</div>
				</div>
			{/if}
		</div>
		<footer role="contentinfo">
			<p>Search powered by JavaScript.</p>
		</footer>
	</section>
</dialog>

<style lang="postcss">
	header {
		--border: var(--c-fg);

		border-bottom: var(--b-medium);
		display: flex;
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: var(--c-bg);

		&::before {
			content: '> ';
			position: relative;
			top: 12px;
			padding-left: 10px;
		}
	}

	header:focus-within {
		--border: var(--c-primary);
	}

	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	dialog {
		padding: 0;
		background-color: var(--c-bg);
		height: var(--search-height, 50vh);
		border: var(--b-medium);
		border-color: var(--c-fg);
		border-radius: var(--br-medium);
		position: relative;
		max-width: 100%;
		width: 100%;

		@media (--above-med) {
			width: clamp(600px, 90vw, 950px);
		}
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.8);
	}

	.results {
		padding: 10px 5px;
		min-height: var(--search-height);
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		overflow: hidden;
		width: 100%;

		& > * {
			overflow: hidden;
			width: 100%;
			grid-row: 1 / -1;
			grid-column: 1 / -1;
		}

		@media (--above-med) {
			padding: 20px 0;
		}
	}

	.search-input {
		width: 100%;
		border: none;
		padding: 10px 50px 10px 10px;
		font-size: var(--fs-4);
		outline-color: transparent;
		background-color: transparent;
		color: var(--c-fg);
		font-family: var(--ff-body);
	}

	footer {
		position: sticky;
		bottom: 0;
		text-align: right;

		p {
			font-size: var(--fs-1);
			color: var(--c-white);
			font-style: italic;
			background: var(--c-black);
			padding: 5px;
			margin: 0;
			display: inline-block;
		}

		@media (--below-med) {
			display: none;
		}
	}

	.recent-searches {
		padding: 20px;
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 20px;
	}

	.color-boxes {
		display: grid;
		grid-template-columns: repeat(6, 1fr);

		button {
			appearance: none;
			box-shadow: none;
			border-radius: 0;
			height: 20px;
			background-color: var(--c-yellow);
		}

		button:nth-child(2) {
			background-color: var(--c-teal);
		}

		button:nth-child(3) {
			background-color: var(--c-green);
		}

		button:nth-child(4) {
			background-color: var(--c-red);
		}

		button:nth-child(5) {
			background-color: var(--c-purple);
		}

		button:nth-child(6) {
			background-color: var(--c-black);
		}

		button:nth-child(7) {
			background-color: var(--c-yellow-2);
		}

		button:nth-child(8) {
			background-color: var(--c-teal-2);
		}

		button:nth-child(9) {
			background-color: var(--c-green-2);
		}

		button:nth-child(10) {
			background-color: var(--c-red-2);
		}

		button:nth-child(11) {
			background-color: var(--c-purple-2);
		}

		button:nth-child(12) {
			background-color: var(--c-black-2);
		}
	}
</style>
