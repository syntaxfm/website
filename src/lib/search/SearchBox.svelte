<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { overlay_open, search_query, search_recent, searching } from '$state/search';
	import { onMount, tick } from 'svelte';
	import SearchWorker from './search-worker.js?worker';
	import SearchResults from './SearchResults.svelte';
	import SearchResultList from './SearchResultList.svelte';
	import { fade } from 'svelte/transition';
	import type { Tree } from './types';
	import { clickOutDialog } from '$actions/click_outside_dialog';

	let modal: HTMLDialogElement;
	let search: {
		results: Tree[];
		query: string;
	} | null = null;
	let recent_searches: Tree[] = [];
	let worker: Worker;
	let ready = false;

	let uid = 1;
	const pending = new Set();

	onMount(async () => {
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
		modal.showModal();
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
>
	<div>
		<header>
			<input
				autofocus
				on:keydown={(e) => {
					if (e.key === 'Enter' && !e.isComposing) {
						modal.querySelector('a[data-has-node]')?.click();
					}
				}}
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
				<div transition:fade={{ duration: 300 }}>
					<h5 class:empty={recent_searches.length === 0}>
						{recent_searches.length ? 'Recent searches' : 'No recent searches'}
					</h5>

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
			{/if}
		</div>
		<footer>
			<p>
				<!-- If you came into the source to look at what vibes is, it's this code -->
				Search powered by vibes.
			</p>
		</footer>
	</div>
</dialog>

<style lang="postcss">
	header {
		border-bottom: solid 4px var(--border);
		display: flex;
	}

	h5 {
		font-style: italic;
	}

	header:focus-within {
		outline: 1px solid var(--primary);
		background-color: var(--bg-sheet);
	}

	dialog {
		--search-height: 50vh;
		padding: 0;
		background-color: var(--bg-1);
		height: var(--search-height);
		border: var(--border);

		max-width: 100%;
		width: 100%;
		@media (--above_med) {
			width: 60vw;
		}
	}

	h5 {
		margin: 1rem 0;
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
			padding: 20px;
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
</style>
