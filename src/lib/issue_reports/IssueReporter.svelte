<script lang="ts">
	// The admins' Report tab: drag over the area to report (a tap or click takes the whole screen),
	// write what needs to change, and it's filed as a GitHub issue with screenshots of the
	// selection, the screen and the full page.
	import { tick } from 'svelte';
	import toast from 'svelte-french-toast';
	import { page } from '$app/state';
	import { error_message as message_of } from '#lib/utils/error_message.ts';
	import IssueReportDialog from './IssueReportDialog.svelte';
	import { file_report } from './issue_report.remote';
	import type {
		FiledIssue,
		IssueReportPage,
		PageError,
		Screenshot,
		ViewportRect
	} from './issue_report_schema';
	import {
		collect_page,
		full_page_screenshot,
		is_click,
		page_error_from,
		rect_between,
		screen_screenshots
	} from './page_capture';

	type Stage = 'idle' | 'selecting' | 'capturing' | 'writing';
	type Filing =
		| { id: number; status: 'filing' }
		| { id: number; status: 'filed'; issue: FiledIssue };
	interface Draft {
		page: IssueReportPage;
		selection: Screenshot | null;
		screen: Screenshot | null;
		// Drawn while the admin writes
		full_page: Promise<Screenshot | null>;
		preview_url: string | null;
	}

	// Script errors are worth knowing about in a report; the last few are kept
	const MAX_PAGE_ERRORS = 10;
	const MAX_SHOWN_FILINGS = 3;

	let stage = $state<Stage>('idle');
	let selection = $state<ViewportRect | null>(null);
	let draft = $state<Draft | null>(null);
	let request = $state('');
	let error_message = $state('');
	let filings = $state<Filing[]>([]);

	let drag_start: { x: number; y: number } | null = null;
	let next_filing_id = 0;
	const page_errors: PageError[] = [];

	function record_error(event: Event) {
		if (!(event instanceof ErrorEvent || event instanceof PromiseRejectionEvent)) return;
		page_errors.push(page_error_from(event));
		if (page_errors.length > MAX_PAGE_ERRORS) page_errors.shift();
	}

	function discard_draft() {
		if (draft?.preview_url) URL.revokeObjectURL(draft.preview_url);
		draft = null;
		request = '';
		error_message = '';
	}

	function start_report() {
		if (stage !== 'idle') return;
		discard_draft();
		selection = null;
		stage = 'selecting';
	}

	function cancel_selection(event: Event) {
		event.preventDefault();
		drag_start = null;
		stage = 'idle';
	}

	function show_modal(dialog: HTMLDialogElement) {
		dialog.showModal();
		return () => dialog.close();
	}

	function begin_selection(event: PointerEvent & { currentTarget: HTMLDialogElement }) {
		if (event.button !== 0) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		drag_start = { x: event.clientX, y: event.clientY };
		selection = rect_between(drag_start, drag_start);
	}

	function extend_selection(event: PointerEvent) {
		if (drag_start) selection = rect_between(drag_start, { x: event.clientX, y: event.clientY });
	}

	function finish_selection(event: PointerEvent) {
		if (!drag_start) return;
		const rect = rect_between(drag_start, { x: event.clientX, y: event.clientY });
		drag_start = null;
		void capture(is_click(rect) ? null : rect);
	}

	function select_by_key(event: KeyboardEvent) {
		if (event.key === 'Enter') void capture(null);
	}

	async function capture(rect: ViewportRect | null) {
		stage = 'capturing';
		selection = null;
		// The overlay leaves the page before anything is measured or drawn
		await tick();
		const page_facts = collect_page({
			route_id: page.route.id,
			selection: rect,
			errors: [...page_errors]
		});

		let shots: Pick<Draft, 'selection' | 'screen' | 'preview_url'> = {
			selection: null,
			screen: null,
			preview_url: null
		};
		try {
			const { preview, ...screenshots } = await screen_screenshots(page_facts);
			shots = { ...screenshots, preview_url: URL.createObjectURL(preview) };
		} catch (screen_error) {
			console.error('Could not draw the screen for the issue report', screen_error);
		}

		draft = { page: page_facts, ...shots, full_page: full_page_screenshot(page_facts) };
		stage = 'writing';
	}

	function cancel_report() {
		discard_draft();
		stage = 'idle';
	}

	async function submit_report(submitted_request: string) {
		if (!draft) return;
		const submitted = draft;
		const filing_id = next_filing_id++;
		draft = null;
		request = '';
		error_message = '';
		stage = 'idle';
		filings = [...filings, { id: filing_id, status: 'filing' }];

		try {
			const issue = await file_report({
				request: submitted_request,
				screenshots: {
					selection: submitted.selection,
					screen: submitted.screen,
					page: await submitted.full_page
				},
				page: submitted.page
			});
			filings = filings
				.map((filing) =>
					filing.id === filing_id ? { id: filing_id, status: 'filed' as const, issue } : filing
				)
				.slice(-MAX_SHOWN_FILINGS);
			if (submitted.preview_url) URL.revokeObjectURL(submitted.preview_url);
		} catch (file_error) {
			console.error('Could not file the issue report', file_error);
			filings = filings.filter((filing) => filing.id !== filing_id);
			const message = message_of(file_error, 'Something went wrong. Check the console.');
			// Back to the dialog with the request kept, unless another report has started
			if (stage === 'idle') {
				draft = submitted;
				request = submitted_request;
				error_message = `Not filed: ${message}`;
				stage = 'writing';
			} else {
				if (submitted.preview_url) URL.revokeObjectURL(submitted.preview_url);
				toast.error(`Not filed: ${message}`);
			}
		}
	}
</script>

<svelte:window onerror={record_error} onunhandledrejection={record_error} />

<div class="issue-reporter" data-issue-reporter>
	<output>
		{#if stage === 'capturing'}
			<span>Capturing…</span>
		{/if}
		{#each filings as filing (filing.id)}
			{#if filing.status === 'filing'}
				<span>Filing…</span>
			{:else}
				<a href={filing.issue.url} target="_blank" rel="noreferrer" title={filing.issue.title}
					>#{filing.issue.number}</a
				>
			{/if}
		{/each}
	</output>
	<button type="button" onclick={start_report} disabled={stage !== 'idle'}>Report</button>
</div>

{#if stage === 'selecting'}
	<dialog
		class="issue-report-selector"
		aria-label="Select the area to report"
		data-issue-reporter
		{@attach show_modal}
		oncancel={cancel_selection}
		onpointerdown={begin_selection}
		onpointermove={extend_selection}
		onpointerup={finish_selection}
		onkeydown={select_by_key}
	>
		{#if selection}
			<div
				class="selection"
				style:left="{selection.x}px"
				style:top="{selection.y}px"
				style:width="{selection.width}px"
				style:height="{selection.height}px"
			></div>
		{/if}
	</dialog>
{/if}

{#if stage === 'writing' && draft}
	<IssueReportDialog
		preview_url={draft.preview_url}
		bind:request
		{error_message}
		onsubmit={submit_report}
		oncancel={cancel_report}
	/>
{/if}

<style>
	/*
		A tab on the right edge, halfway down, so it's in reach wherever the admin has scrolled to, on
		a phone too, and clear of the header and the player. Above the site's own layers (Nav is 60).
	*/
	.issue-reporter {
		position: fixed;
		inset-inline-end: 0;
		inset-block-start: 50%;
		z-index: 70;
		display: flex;
		align-items: center;
		gap: var(--pad-xsmall);
		translate: 0 -50%;
	}

	button {
		padding: var(--pad-small) var(--pad-xsmall);
		font-size: var(--fs-1);
		line-height: 1;
		color: var(--c-bg);
		white-space: nowrap;
		writing-mode: vertical-rl;
		background-color: var(--c-fg);
		border-radius: var(--br-small) 0 0 var(--br-small);
		box-shadow: var(--s-graphic);

		&:hover {
			background-color: var(--c-fg-8);
		}

		&:focus-visible {
			outline: 2px solid var(--c-primary);
			outline-offset: 2px;
		}

		&:disabled {
			cursor: progress;
		}
	}

	output {
		display: flex;
		flex-direction: column;
		align-items: end;
		gap: var(--pad-xsmall);

		& > * {
			padding: var(--pad-xsmall) var(--pad-small);
			font-size: var(--fs-1);
			color: var(--c-bg);
			white-space: nowrap;
			background-color: var(--c-fg);
			border-radius: var(--br-small);
		}

		a {
			text-decoration-color: var(--c-primary);
		}
	}

	/* Covers the viewport so a drag anywhere draws the selection; outside it is dimmed */
	.issue-report-selector {
		position: fixed;
		inset: 0;
		width: 100vw;
		max-width: none;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0;
		cursor: crosshair;
		touch-action: none;
		user-select: none;
		background-color: var(--c-black-3);
		border: 0;

		&:has(.selection) {
			background-color: transparent;
		}

		&::backdrop {
			background-color: transparent;
		}
	}

	.selection {
		position: fixed;
		outline: 2px solid var(--c-primary);
		box-shadow: 0 0 0 100vmax var(--c-black-3);
	}
</style>
