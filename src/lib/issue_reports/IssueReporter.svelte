<script lang="ts">
	// The admin menu's Report button: drag over the area to report (a tap or click takes the whole
	// screen), write what needs to change, and it's filed as a GitHub issue with screenshots of the
	// selection, the screen and the full page, taken by the server's headless browser meanwhile. It
	// opens the page as soon as Report is clicked, so the page loads while the admin selects.
	import { tick } from 'svelte';
	import toast from 'svelte-french-toast';
	import { page } from '$app/state';
	import { error_message as message_of } from '#lib/utils/error_message.ts';
	import IssueReportDialog from './IssueReportDialog.svelte';
	import {
		file_report,
		open_report_page,
		take_full_page_screenshot,
		take_screen_screenshot
	} from './issue_report.remote';
	import type {
		FiledIssue,
		IssueReport,
		IssueReportPage,
		PageError,
		Screenshot,
		ViewportRect
	} from './issue_report_schema';
	import {
		collect_page,
		cut_selection,
		is_click,
		page_error_from,
		rect_between,
		screenshot_url
	} from './page_capture';

	type Stage = 'idle' | 'selecting' | 'writing';
	type Filing =
		| { id: number; status: 'filing' }
		| { id: number; status: 'filed'; issue: FiledIssue };
	type Screenshots = IssueReport['screenshots'];
	interface ScreenAndSelection {
		// The headless browser's page, to shoot the full page in
		kept_page: string | null;
		screen: Screenshot | null;
		selection: Screenshot | null;
	}
	interface Draft {
		id: number;
		page: IssueReportPage;
		// For the preview, first
		screen_and_selection: Promise<ScreenAndSelection>;
		// All three, taken while the admin writes
		screenshots: Promise<Screenshots>;
		preview_url: string | null;
		is_shooting: boolean;
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
	// The page Report opened in the headless browser (its id), loading while the admin selects
	let opened_page: Promise<string | null> = Promise.resolve(null);

	let drag_start: { x: number; y: number } | null = null;
	// Fingers on the selection overlay, by pointer id, where each last was
	let touches: Record<number, { x: number; y: number }> = {};
	const finger_count = () => Object.keys(touches).length;
	let next_draft_id = 0;
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
		const page_facts = collect_page({ route_id: page.route.id, selection: null, errors: [] });
		opened_page = open_report_page(page_facts).catch((open_error) => {
			console.error('The headless browser could not open the page', open_error);
			return null;
		});
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

	// The server's headless browser shoots the screen; the selection is cut from it here
	async function shoot_screen(
		page_facts: IssueReportPage,
		opened: Promise<string | null>
	): Promise<ScreenAndSelection> {
		try {
			const shot = await take_screen_screenshot({ kept_page: await opened, page: page_facts });
			const selection = await cut_selection(shot.screen, page_facts);
			return { kept_page: shot.kept_page, screen: shot.screen, selection };
		} catch (screenshot_error) {
			console.error('The headless browser could not shoot the screen', screenshot_error);
			return { kept_page: null, screen: null, selection: null };
		}
	}

	// Then the full page, in the same headless page
	async function shoot_full_page(
		page_facts: IssueReportPage,
		screen_and_selection: Promise<ScreenAndSelection>
	): Promise<Screenshots> {
		const { kept_page, screen, selection } = await screen_and_selection;
		try {
			const full_page = await take_full_page_screenshot({ kept_page, page: page_facts });
			return { selection, screen, page: full_page };
		} catch (screenshot_error) {
			console.error('The headless browser could not shoot the full page', screenshot_error);
			return { selection, screen, page: null };
		}
	}

	async function capture(rect: ViewportRect | null) {
		stage = 'writing';
		selection = null;
		// The overlay leaves the page before anything is measured
		await tick();
		const page_facts = collect_page({
			route_id: page.route.id,
			selection: rect,
			errors: [...page_errors]
		});
		const id = next_draft_id++;
		const screen_and_selection = shoot_screen(page_facts, opened_page);
		draft = {
			id,
			page: page_facts,
			screen_and_selection,
			screenshots: shoot_full_page(page_facts, screen_and_selection),
			preview_url: null,
			is_shooting: true
		};
		void show_preview(id, screen_and_selection);
	}

	// Once it's taken, unless that draft has gone (filed, cancelled) or already shows it
	async function show_preview(id: number, screen_and_selection: Promise<ScreenAndSelection>) {
		const taken = await screen_and_selection;
		if (draft?.id !== id || !draft.is_shooting) return;
		const preview = taken.selection ?? taken.screen;
		draft.preview_url = preview ? screenshot_url(preview) : null;
		draft.is_shooting = false;
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
				screenshots: await submitted.screenshots,
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
				void show_preview(submitted.id, submitted.screen_and_selection);
			} else {
				if (submitted.preview_url) URL.revokeObjectURL(submitted.preview_url);
				toast.error(`Not filed: ${message}`);
			}
		}
	}
</script>

<svelte:window onerror={record_error} onunhandledrejection={record_error} />

<div class="issue-reporter">
	<button type="button" onclick={start_report} disabled={stage !== 'idle'}>Report</button>
	<output>
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
		is_shooting={draft.is_shooting}
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
