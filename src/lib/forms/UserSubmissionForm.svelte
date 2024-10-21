<script lang="ts">
	import { enhance } from '$app/forms';
	import { form_action } from '../form_action';
	import { Turnstile } from 'svelte-turnstile';
	import { env } from '$env/dynamic/public';
	import InlineError from './InlineError.svelte';
	import { UserSubmissionType } from '@prisma/client';
	import type { ActionData } from '../../routes/(site)/oss/$types';
	let reset: (() => void) | undefined = $state();
	interface Props {
		form: ActionData;
		selected_submission_type?: UserSubmissionType;
	}

	let { form, selected_submission_type = 'SPOOKY' }: Props = $props();
</script>

{#if form?.error}
	<div class="error status">
		<p>Shoot! {form.message}</p>
		<p class="text-sm">Error: {form.error}</p>
	</div>
{:else if form?.status === 200}
	<div class="success status">
		<p>Success!</p>
		<p class="text-sm">{form.message}</p>
	</div>
{/if}
<form
	action="?"
	method="post"
	use:enhance={form_action(undefined, undefined, (data, context) => {
		if (data.status === 200) {
			return context?.formElement.reset();
		}
		if (data.error) {
			console.info('Resetting turnstile');
			reset?.();
		}
	})}
>
	<div class="input-group">
		<label for="submission_type">Submission Type</label>
		<div class="input">
			<InlineError displayError={form?.fieldErrors?.['submission_type']} />
			<select name="submission_type" id="submission_type" value={selected_submission_type}>
				<option value="POTLUCK">Potluck Question</option>
				<option value="SPOOKY">👻🎃 Spooky Story Submission</option>
				<option value="GUEST">Guest Suggestion</option>
				<option value="FEEDBACK">Show Feedback</option>
				<option value="OSS">💰 OSS Funding Suggestion</option>
				<option value="OTHER">Other</option>
			</select>
		</div>
	</div>
	<div class="input-group">
		<div>
			<label for="body">What's Up?</label>
			<p class="required">Required</p>
		</div>
		<div class="input">
			<InlineError displayError={form?.fieldErrors?.['body']} />
			<textarea
				id="body"
				name="body"
				placeholder="What do you have to say? Write as much as you like!"
				required
				minlength={25}
				maxlength={15000}
			></textarea>
		</div>
	</div>

	<div class="input-group">
		<label for="name">Name</label>
		<div class="input">
			<InlineError displayError={form?.fieldErrors?.['name']} />
			<input
				type="text"
				id="name"
				name="name"
				placeholder="Name, @handle, or Alias"
				maxlength={100}
			/>
		</div>
	</div>

	<div class="input-group">
		<label for="email">Email</label>
		<div class="input">
			<InlineError displayError={form?.fieldErrors?.['email']} />
			<input
				type="email"
				id="email"
				name="email"
				placeholder="Only if we need it"
				maxlength={100}
			/>
		</div>
	</div>
	<div class="input-group turnstile">
		<Turnstile appearance="interaction-only" siteKey={env.PUBLIC_TURNSTILE_SITE_KEY} bind:reset />
	</div>
	<button type="submit">Send</button>
</form>

<style lang="postcss">
	form {
		display: grid;
		gap: 1rem;
		margin: 2rem;
		grid-template-columns: auto 1fr;
		max-width: 800px;
		@media (--below-med) {
			grid-template-columns: 1fr;
		}
	}
	.input-group {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		justify-items: end;
		align-items: baseline;
		@media (--below-med) {
			justify-items: start;
		}
	}
	.input {
		width: 100%;
		display: grid;
		grid-template-columns: subgrid;
	}
	.turnstile {
		grid-column: 1 / -1;
		display: block;
		text-align: right;
	}

	button {
		width: 100%;
		display: block;
		grid-column: 2 / -1;
		@media (--below-med) {
			grid-column: 1 / -1;
		}
	}
	.status {
		padding: 10px;
		background: var(--subtle);
		border-left: 8px solid var(--primary);
		font-size: var(--font-size-sm);
		margin: 1rem 0;
		width: fit-content;
		&.error {
			border-color: var(--warning);
		}
		p {
			margin: 0;
		}
	}
	input,
	textarea,
	select {
		width: 100%;
		padding: 0.6rem;
		border-radius: 5px;
		font-family: var(--body-font-family);
		border: 1px solid var(--fg);
	}
	textarea {
		min-height: 150px;
		resize: vertical;
	}
	.required {
		color: var(--warning);
		font-size: 8px;
		text-transform: uppercase;
		margin: 0;
		text-align: right;
	}
</style>
