<script lang="ts">
	// The admin menu's Report button: drag over the area to report (a tap or click takes the whole
	// screen), write what needs to change, and it's filed as a GitHub issue with screenshots of the
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
	// Fingers on the selection overlay, by pointer id, where each last was
	let touches: Record<number, { x: number; y: number }> = {};
	const finger_count = () => Object.keys(touches).length;
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
		touches = {};
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

	// While selecting, one finger draws the box and two fingers scroll the page (a mouse wheel
	// scrolls it anyway), so the Report button at the top can reach anything further down
	function begin_selection(event: PointerEvent & { currentTarget: HTMLDialogElement }) {
		if (event.button !== 0) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		if (event.pointerType === 'touch') {
			touches[event.pointerId] = { x: event.clientX, y: event.clientY };
			if (finger_count() > 1) {
				drag_start = null;
				selection = null;
				return;
			}
		}
		drag_start = { x: event.clientX, y: event.clientY };
		selection = rect_between(drag_start, drag_start);
	}

	function extend_selection(event: PointerEvent) {
		const last_touch = touches[event.pointerId];
		const fingers = finger_count();
		if (fingers > 1 && last_touch) {
			// Each finger moves the page by its share, so two fingers together move it as far as they go
			scrollBy((last_touch.x - event.clientX) / fingers, (last_touch.y - event.clientY) / fingers);
			touches[event.pointerId] = { x: event.clientX, y: event.clientY };
			return;
		}
		if (drag_start) selection = rect_between(drag_start, { x: event.clientX, y: event.clientY });
	}

	function finish_selection(event: PointerEvent) {
		delete touches[event.pointerId];
		if (!drag_start) return;
		const rect = rect_between(drag_start, { x: event.clientX, y: event.clientY });
		drag_start = null;
		void capture(is_click(rect) ? null : rect);
	}

	function forget_touch(event: PointerEvent) {
		delete touches[event.pointerId];
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
	<button type="button" onclick={start_report} disabled={stage !== 'idle'}>Report</button>
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
		onpointercancel={forget_touch}
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
		At the end of the admin menu, and still in view when the menu scrolls sideways on phones. It
		reaches over the menu's end padding, so links scrolling under it don't show past it.
	*/
	.issue-reporter {
		position: sticky;
		inset-inline-end: calc(var(--pad-medium) * -1);
		display: flex;
		align-items: center;
		gap: var(--pad-small);
		margin-inline: auto calc(var(--pad-medium) * -1);
		padding-inline: var(--pad-small) var(--pad-medium);
		background-color: var(--c-bg);
	}

	button {
		padding: 0;
		font-size: var(--fs-2);
		line-height: inherit;
		color: var(--c-fg-7);
		white-space: nowrap;
		background: none;
		text-underline-offset: var(--pad-xsmall);

		&:hover,
		&:focus-visible {
			color: var(--c-fg);
			text-decoration: underline;
			text-decoration-color: var(--c-primary);
			background: none;
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
		gap: var(--pad-small);
		font-size: var(--fs-2);
		color: var(--c-fg-7);
		white-space: nowrap;

		a {
			color: var(--c-fg);
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
