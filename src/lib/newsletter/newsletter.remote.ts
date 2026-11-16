import { form, query } from '$app/server';
import { CONVERT_KIT_V4_API_KEY, CONVERT_KIT_SECRET, TURNSTILE_SECRET } from '$app/env/private';
import * as v from 'valibot';
import { edge_cached } from '$server/edge_cache';
import { validateToken } from '#lib/forms/validateTurnstileToken.ts';
import { fetch_kit_json, post_to_kit } from '$server/newsletter/kit';
import { get_newsletter_issues } from '$server/newsletter/issues';

// "SNACK PACK FORM - GENERAL" in Kit, the form the site's signups have always gone to
const SNACK_PACK_FORM_ID = 5465361;

const numberformatter = new Intl.NumberFormat('en-US');

function formatNumber(n: number) {
	return `${numberformatter.format(n)}`;
}

const subscribe_schema = v.object({
	email_address: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Enter your email'),
		v.maxLength(254, 'That email is too long'),
		v.email("That email doesn't look right")
	),
	cf_turnstile_response: v.optional(v.string())
});

type SubscribeResult = { is_subscribed: boolean; message: string };

// Signs someone up from the site itself, so they never leave the page for Kit's.
export const subscribe_to_newsletter = form(
	subscribe_schema,
	async ({ email_address, cf_turnstile_response }): Promise<SubscribeResult> => {
		if (!TURNSTILE_SECRET) throw new Error('TURNSTILE_SECRET is not set');
		if (!CONVERT_KIT_V4_API_KEY) throw new Error('CONVERT_KIT_V4_API_KEY is not set');

		// Every signup sends a confirm email, so bots can't use the form to mail strangers
		const { success } = await validateToken(cf_turnstile_response, TURNSTILE_SECRET);
		if (!success) {
			return { is_subscribed: false, message: "We couldn't tell you're human. Try again?" };
		}

		try {
			// New subscribers start unconfirmed. Adding them to the form then follows the form's
			// opt-in setting: Kit sends its confirm email, as its own plugins do. Kit leaves an
			// existing subscriber's state alone.
			await post_to_kit('/v4/subscribers', CONVERT_KIT_V4_API_KEY, {
				email_address,
				state: 'inactive'
			});
			await post_to_kit(`/v4/forms/${SNACK_PACK_FORM_ID}/subscribers`, CONVERT_KIT_V4_API_KEY, {
				email_address
			});
			return { is_subscribed: true, message: 'Check your email to confirm.' };
		} catch (error) {
			console.error('Could not add a newsletter signup to Kit', error);
			return { is_subscribed: false, message: 'Something went wrong. Try again?' };
		}
	}
);

// Read from Postgres, where the issues are kept as content (src/server/newsletter/issues.ts)
export const get_newsletter_archive = query(get_newsletter_issues);

// One Kit request, edge cached, so the banner's number never holds up the page
export const get_subscriber_count = query(async (): Promise<string> => {
	if (!CONVERT_KIT_SECRET) return '';

	try {
		return await edge_cached(
			'newsletter-subscriber-count',
			{ fresh_seconds: 60 * 60 * 6, stale_seconds: 60 * 60 * 24 * 30 },
			async () => {
				const { total_subscribers } = await fetch_kit_json<{ total_subscribers?: number }>(
					`https://api.convertkit.com/v3/subscribers?api_secret=${CONVERT_KIT_SECRET}`
				);
				if (typeof total_subscribers !== 'number') {
					throw new Error('Kit returned no total_subscribers');
				}
				return formatNumber(total_subscribers);
			}
		);
	} catch (error) {
		console.error('Could not load the Snack Pack subscriber count from Kit', error);
		return '';
	}
});
