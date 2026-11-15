import { isHttpError } from '@sveltejs/kit';

// The message to show for a failed remote call: an HttpError's body message, or an Error's
export function error_message(error: unknown, fallback: string): string {
	if (isHttpError(error)) return error.body.message;
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}
