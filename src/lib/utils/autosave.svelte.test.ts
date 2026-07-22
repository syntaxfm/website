import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create_autosave_controller } from './autosave.svelte';

interface DeferredPromise {
	promise: Promise<void>;
	resolve: () => void;
	reject: (error: unknown) => void;
}

interface PartialShowPayload {
	title?: string;
	guest_ids?: string[];
	tag_ids?: string[];
}

function create_deferred_promise(): DeferredPromise {
	let resolve_promise!: () => void;
	let reject_promise!: (error: unknown) => void;
	const promise = new Promise<void>((resolve, reject) => {
		resolve_promise = resolve;
		reject_promise = reject;
	});

	return {
		promise,
		resolve: resolve_promise,
		reject: reject_promise
	};
}

describe('autosave controller', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('debounces edits and saves only the latest value', async () => {
		const save_callback = vi.fn(async (_value: string): Promise<void> => undefined);
		const autosave = create_autosave_controller(save_callback, { debounce_ms: 300 });

		autosave.schedule('first');
		autosave.schedule('latest');

		expect(autosave.state).toBe('dirty');
		await vi.advanceTimersByTimeAsync(299);
		expect(save_callback).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(save_callback).toHaveBeenCalledTimes(1);
		expect(save_callback).toHaveBeenCalledWith('latest');
		expect(autosave.state).toBe('saved');
	});

	it('can save immediately and cancels the debounce timeout', async () => {
		const save_callback = vi.fn(async (_value: string): Promise<void> => undefined);
		const autosave = create_autosave_controller(save_callback, { debounce_ms: 500 });

		autosave.schedule('now');
		await autosave.save_now();
		await vi.runAllTimersAsync();

		expect(save_callback).toHaveBeenCalledTimes(1);
		expect(save_callback).toHaveBeenCalledWith('now');
		expect(autosave.state).toBe('saved');
	});

	it('runs saves sequentially and follows an in-flight save with the latest edit', async () => {
		const first_save = create_deferred_promise();
		const second_save = create_deferred_promise();
		const save_callback = vi
			.fn<(value: string) => Promise<void>>()
			.mockImplementationOnce(() => first_save.promise)
			.mockImplementationOnce(() => second_save.promise);
		const autosave = create_autosave_controller(save_callback, { debounce_ms: 100 });

		autosave.schedule('first');
		const save_promise = autosave.save_now();
		autosave.schedule('second');
		autosave.schedule('latest');

		expect(save_callback).toHaveBeenCalledTimes(1);
		expect(save_callback).toHaveBeenNthCalledWith(1, 'first');
		expect(autosave.state).toBe('saving');

		first_save.resolve();
		await Promise.resolve();

		expect(save_callback).toHaveBeenCalledTimes(2);
		expect(save_callback).toHaveBeenNthCalledWith(2, 'latest');
		expect(autosave.state).toBe('saving');

		second_save.resolve();
		await save_promise;

		expect(autosave.state).toBe('saved');
	});

	it('merges partial values queued during an active save into one follow-up save', async () => {
		const first_save = create_deferred_promise();
		const save_callback = vi
			.fn<(value: PartialShowPayload) => Promise<void>>()
			.mockImplementationOnce(() => first_save.promise)
			.mockResolvedValueOnce(undefined);
		const autosave = create_autosave_controller(save_callback, {
			merge_pending_values: (previous_value, next_value) => ({
				...previous_value,
				...next_value
			})
		});

		autosave.schedule({ title: 'Initial title' });
		const save_promise = autosave.save_now();
		autosave.schedule({ title: 'Guest title', guest_ids: ['guest-1'] });
		autosave.schedule({ title: 'Latest title', tag_ids: ['tag-1'] });

		expect(save_callback).toHaveBeenCalledTimes(1);
		expect(save_callback).toHaveBeenNthCalledWith(1, { title: 'Initial title' });

		first_save.resolve();
		await save_promise;

		expect(save_callback).toHaveBeenCalledTimes(2);
		expect(save_callback).toHaveBeenNthCalledWith(2, {
			title: 'Latest title',
			guest_ids: ['guest-1'],
			tag_ids: ['tag-1']
		});
		expect(autosave.state).toBe('saved');
	});

	it('retries the latest failed value and exposes a concise error', async () => {
		const long_error = `Save failed ${'because the server was unavailable '.repeat(10)}`;
		const save_callback = vi
			.fn<(value: string) => Promise<void>>()
			.mockRejectedValueOnce(new Error(long_error))
			.mockResolvedValueOnce(undefined);
		const autosave = create_autosave_controller(save_callback);

		autosave.schedule('draft');
		await autosave.save_now();

		expect(autosave.state).toBe('error');
		expect(autosave.error_message).toMatch(/^Save failed/);
		expect(autosave.error_message.length).toBeLessThanOrEqual(160);

		await autosave.retry();

		expect(save_callback).toHaveBeenCalledTimes(2);
		expect(save_callback).toHaveBeenLastCalledWith('draft');
		expect(autosave.error_message).toBe('');
		expect(autosave.state).toBe('saved');
	});

	it('continues with a newer edit when an older in-flight save fails', async () => {
		const first_save = create_deferred_promise();
		const save_callback = vi
			.fn<(value: string) => Promise<void>>()
			.mockImplementationOnce(() => first_save.promise)
			.mockResolvedValueOnce(undefined);
		const autosave = create_autosave_controller(save_callback);

		autosave.schedule('old');
		const save_promise = autosave.save_now();
		autosave.schedule('new');
		first_save.reject(new Error('Old response failed'));
		await save_promise;

		expect(save_callback).toHaveBeenCalledTimes(2);
		expect(save_callback).toHaveBeenLastCalledWith('new');
		expect(autosave.error_message).toBe('');
		expect(autosave.state).toBe('saved');
	});

	it('flushes the latest debounced value during navigation cleanup', async () => {
		const save_callback = vi.fn(async (_value: string): Promise<void> => undefined);
		const autosave = create_autosave_controller(save_callback, { debounce_ms: 100 });

		autosave.schedule('first');
		autosave.schedule('latest');
		autosave.cleanup();
		autosave.schedule('ignored after cleanup starts');
		await vi.runAllTimersAsync();

		expect(save_callback).toHaveBeenCalledTimes(1);
		expect(save_callback).toHaveBeenCalledWith('latest');
		expect(autosave.state).toBe('saved');
	});

	it('flushes the latest value queued behind an active save during cleanup', async () => {
		const first_save = create_deferred_promise();
		const save_callback = vi
			.fn<(value: string) => Promise<void>>()
			.mockImplementationOnce(() => first_save.promise)
			.mockResolvedValueOnce(undefined);
		const autosave = create_autosave_controller(save_callback);

		autosave.schedule('active');
		const active_save = autosave.save_now();
		autosave.schedule('queued');
		autosave.schedule('latest queued');
		autosave.cleanup();
		autosave.schedule('ignored after cleanup starts');

		first_save.resolve();
		await active_save;

		expect(save_callback).toHaveBeenCalledTimes(2);
		expect(save_callback).toHaveBeenNthCalledWith(1, 'active');
		expect(save_callback).toHaveBeenNthCalledWith(2, 'latest queued');
		expect(autosave.state).toBe('saved');
	});

	it('contains errors from cleanup flushing', async () => {
		const save_callback = vi.fn(async (_value: string): Promise<void> => {
			throw new Error('Navigation save failed');
		});
		const autosave = create_autosave_controller(save_callback);

		autosave.schedule('draft');
		autosave.cleanup();
		await vi.runAllTimersAsync();

		expect(save_callback).toHaveBeenCalledWith('draft');
		expect(autosave.state).toBe('error');
		expect(autosave.error_message).toBe('Navigation save failed');
	});
});
