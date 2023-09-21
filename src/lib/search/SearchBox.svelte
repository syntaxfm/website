<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { overlay_open, search_query, search_recent, searching } from '$state/search';
	import { onMount, tick } from 'svelte';
	import SearchWorker from './search-worker.js?worker';
	import SearchResults from './SearchResults.svelte';
	import SearchResultList from './SearchResultList.svelte';
	import { fade } from 'svelte/transition';
	import { clickOutDialog } from '$actions/click_outside_dialog';
	import type { Tree } from './types';

	let search_input: HTMLInputElement;
	let modal: HTMLDialogElement;
	let search: {
		results: Tree[];
		query: string;
	} | null = null;
	let recent_searches: Tree[] = [];
	let worker: Worker;
	let ready = false;
	let active_color = 'var(--fg)';

	let uid = 1;
	const pending = new Set();

	onMount(async () => {
		search_input.focus();
		worker = new SearchWorker();
		worker.addEventListener('message', (event) => {
			const { type, payload } = event.data;
			if (type === 'ready') {
				ready = true;
			}

			if (type === 'results') {
				search = payload;
			}

			if (type === 'recents') {
				recent_searches = payload;
			}
		});

		worker.postMessage({
			type: 'init',
			payload: {
				origin: location.origin
			}
		});
	});

	afterNavigate(() => {
		close();
	});

	async function close() {
		modal.close();
		if ($searching) {
			$searching = false;
		}

		search = null;
	}

	function navigate(href: string) {
		$search_recent = [href, ...$search_recent.filter((x) => x !== href)];
		close();
	}

	$: if (ready) {
		const id = uid++;
		pending.add(id);
		worker.postMessage({ type: 'query', id, payload: $search_query });
	}

	$: if (ready) {
		worker.postMessage({ type: 'recents', payload: $search_recent });
	}

	$: {
		tick().then(() => ($overlay_open = $searching));
	}

	$: if ($searching) {
		$overlay_open = true;
		modal.showModal();
	}

	function change_color(e: MouseEvent) {
		if (e.target) {
			let computed = window.getComputedStyle(e.target).backgroundColor;
			active_color = computed;
		}
	}

	function search_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.isComposing) {
			const anchor: HTMLAnchorElement | null = modal.querySelector('a[data-has-node]');
			if (anchor) {
				anchor.click();
			}
		}
	}
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === 'k' && (navigator.platform === 'MacIntel' ? e.metaKey : e.ctrlKey)) {
			e.preventDefault();
			$search_query = '';

			if ($searching) {
				close();
			} else {
				$searching = true;
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
	style:--bg="var(--bg-sheet)"
	style:--fg="var(--fg-sheet)"
	use:clickOutDialog
	on:click-outside={close}
	aria-labelledby="search-header"
>
	<section aria-label="Search Results Window">
		<header role="banner">
			<input
				bind:this={search_input}
				on:keydown={search_keydown}
				on:input={(e) => {
					$search_query = e.currentTarget.value;
				}}
				value={$search_query}
				placeholder="Search"
				aria-describedby="search-description"
				aria-label="Search"
				spellcheck="false"
				class="search-input"
			/>

			<button class="close" on:click={close} type="submit">×</button>
		</header>
		<div class="results">
			{#if search?.query}
				<div
					transition:fade={{ duration: 300 }}
					class="results-container"
					on:click={() => ($searching = false)}
				>
					<SearchResults
						results={search.results}
						query={search.query}
						on:select={(e) => {
							close();
							navigate(e.detail.href);
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
						<div on:click={change_color} class="color-boxes">
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
							<div class="color-box"></div>
						</div>
					</div>
					<div>
						<h2 class="h5" id="search-header" class:empty={recent_searches.length === 0}>
							Recent searches
						</h2>
						{#if !recent_searches.length}
							<p>No recent searches</p>{/if}

						{#if recent_searches.length}
							<SearchResultList
								results={recent_searches}
								recent_searches={true}
								query={search?.query || ''}
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
			<p>
				<!-- If you came into the source to look at what vibes is, it's this code -->
				Search powered by vibes.
			</p>
		</footer>
	</section>
</dialog>

<style lang="postcss">
	header {
		--border: var(--fg);
		border-bottom: solid 4px var(--border);
		display: flex;
		position: sticky;
		top: 0;
		z-index: 10;
		&::before {
			content: '> ';
			position: relative;
			top: 12px;
			padding-left: 10px;
		}
	}

	header:focus-within {
		--border: var(--primary);
		background-color: var(--bg-sheet);
	}

	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	dialog {
		--search-height: 50vh;
		padding: 0;
		background-color: var(--bg-1);
		height: var(--search-height);
		border: var(--border);
		border-color: var(--fg);

		max-width: 100%;
		width: 100%;
		@media (--above_med) {
			width: 60vw;
		}
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.8);
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
		@media (--above_med) {
			padding: 20px 0;
		}
	}

	.search-input {
		width: 100%;
		border: none;
		padding: 10px;
		font-size: var(--font-size-md);
		outline: none;
		background-color: transparent;
		color: var(--fg);
		font-family: var(--body-font-family);
	}

	footer {
		position: sticky;
		bottom: 0;
		text-align: right;
		p {
			font-size: var(--font-size-smallest);
			color: white;
			font-style: italic;
			background: black;
			padding: 5px 5px;
			margin: -1px;
			display: inline-block;
		}
		@media (--below_med) {
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
	}

	.color-box {
		height: 20px;
		background-color: var(--yellow);
	}
	.color-box:nth-child(2) {
		height: 20px;
		background-color: var(--teal);
	}
	.color-box:nth-child(3) {
		height: 20px;
		background-color: var(--green);
	}
	.color-box:nth-child(4) {
		height: 20px;
		background-color: var(--red);
	}
	.color-box:nth-child(5) {
		height: 20px;
		background-color: var(--purple);
	}
	.color-box:nth-child(6) {
		height: 20px;
		background-color: var(--black);
	}

	.color-box:nth-child(7) {
		height: 20px;
		background-color: var(--yellow-2);
	}
	.color-box:nth-child(8) {
		height: 20px;
		background-color: var(--teal-2);
	}
	.color-box:nth-child(9) {
		height: 20px;
		background-color: var(--green-2);
	}
	.color-box:nth-child(10) {
		height: 20px;
		background-color: var(--red-2);
	}
	.color-box:nth-child(11) {
		height: 20px;
		background-color: var(--purple-2);
	}
	.color-box:nth-child(12) {
		height: 20px;
		background-color: var(--black-2);
	}
</style>
