export type AutosaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export type AutosaveCallback<T> = (value: T) => Promise<void>;

export type AutosavePendingValueMerge<T> = (previous_value: T, next_value: T) => T;

export interface AutosaveOptions<T> {
	debounce_ms?: number;
	merge_pending_values?: AutosavePendingValueMerge<T>;
}

interface PendingSave<T> {
	value: T;
}

const DEFAULT_DEBOUNCE_MS = 500;
const MAX_ERROR_MESSAGE_LENGTH = 160;
const FALLBACK_ERROR_MESSAGE = 'Unable to save changes.';

function get_error_message(error: unknown): string {
	const message =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: FALLBACK_ERROR_MESSAGE;
	const normalized_message = message.trim().replace(/\s+/g, ' ') || FALLBACK_ERROR_MESSAGE;

	if (normalized_message.length <= MAX_ERROR_MESSAGE_LENGTH) {
		return normalized_message;
	}

	return `${normalized_message.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…`;
}

export class AutosaveController<T> {
	#state = $state<AutosaveState>('idle');
	#error_message = $state('');
	#save_callback: AutosaveCallback<T>;
	#debounce_ms: number;
	#merge_pending_values: AutosavePendingValueMerge<T> | undefined;
	#debounce_timeout: ReturnType<typeof setTimeout> | undefined;
	#pending_save: PendingSave<T> | undefined;
	#failed_save: PendingSave<T> | undefined;
	#active_save: Promise<void> | undefined;
	#is_cleanup_started = false;
	#is_destroyed = false;

	constructor(save_callback: AutosaveCallback<T>, options: AutosaveOptions<T> = {}) {
		const debounce_ms = options.debounce_ms ?? DEFAULT_DEBOUNCE_MS;

		if (!Number.isFinite(debounce_ms) || debounce_ms < 0) {
			throw new TypeError('debounce_ms must be a non-negative finite number.');
		}

		this.#save_callback = save_callback;
		this.#debounce_ms = debounce_ms;
		this.#merge_pending_values = options.merge_pending_values;
	}

	get state(): AutosaveState {
		return this.#state;
	}

	get error_message(): string {
		return this.#error_message;
	}

	schedule(value: T): void {
		if (this.#is_cleanup_started || this.#is_destroyed) {
			return;
		}

		this.#pending_save = {
			value:
				this.#pending_save && this.#merge_pending_values
					? this.#merge_pending_values(this.#pending_save.value, value)
					: value
		};
		this.#failed_save = undefined;
		this.#error_message = '';

		if (!this.#active_save) {
			this.#state = 'dirty';
		}

		this.#clear_debounce();
		this.#debounce_timeout = setTimeout(() => {
			this.#debounce_timeout = undefined;
			void this.#start_save();
		}, this.#debounce_ms);
	}

	async save_now(): Promise<void> {
		if (this.#is_cleanup_started || this.#is_destroyed) {
			return;
		}

		this.#clear_debounce();
		await this.#start_save();
	}

	async retry(): Promise<void> {
		if (this.#is_cleanup_started || this.#is_destroyed || !this.#failed_save) {
			return;
		}

		this.#pending_save = this.#failed_save;
		this.#failed_save = undefined;
		this.#error_message = '';
		await this.save_now();
	}

	cleanup(): void {
		if (this.#is_cleanup_started || this.#is_destroyed) {
			return;
		}

		this.#is_cleanup_started = true;
		this.#clear_debounce();
		void this.#finish_cleanup();
	}

	async #finish_cleanup(): Promise<void> {
		try {
			await this.#start_save();
		} catch (error) {
			console.error('Autosave cleanup failed', error);
		} finally {
			this.#is_destroyed = true;
			this.#pending_save = undefined;
			this.#failed_save = undefined;
		}
	}

	async #start_save(): Promise<void> {
		if (this.#active_save) {
			await this.#active_save;
			return;
		}

		if (!this.#pending_save) {
			return;
		}

		const active_save = this.#run_saves();
		this.#active_save = active_save;

		try {
			await active_save;
		} finally {
			if (this.#active_save === active_save) {
				this.#active_save = undefined;
			}
		}
	}

	async #run_saves(): Promise<void> {
		while (!this.#is_destroyed && this.#pending_save) {
			this.#clear_debounce();
			const current_save = this.#pending_save;
			this.#pending_save = undefined;
			this.#state = 'saving';
			this.#error_message = '';

			try {
				await this.#save_callback(current_save.value);
			} catch (error) {
				if (this.#is_destroyed) {
					return;
				}

				if (this.#pending_save) {
					continue;
				}

				this.#failed_save = current_save;
				this.#state = 'error';
				this.#error_message = get_error_message(error);
				return;
			}

			if (this.#is_destroyed) {
				return;
			}

			if (!this.#pending_save) {
				this.#failed_save = undefined;
				this.#state = 'saved';
			}
		}
	}

	#clear_debounce(): void {
		if (this.#debounce_timeout === undefined) {
			return;
		}

		clearTimeout(this.#debounce_timeout);
		this.#debounce_timeout = undefined;
	}
}

export function create_autosave_controller<T>(
	save_callback: AutosaveCallback<T>,
	options?: AutosaveOptions<T>
): AutosaveController<T> {
	return new AutosaveController(save_callback, options);
}
