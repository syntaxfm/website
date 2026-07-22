<script lang="ts">
	import { can_auto_update_slug, create_admin_slug, initialize_admin_slug } from './slug_editor';

	interface Props {
		title?: string;
		slug?: string;
		label?: string;
		id?: string;
		show_regenerate?: boolean;
		onchange?: (next_slug: string) => void;
	}

	const uid = $props.id();

	let {
		title = $bindable(''),
		slug = $bindable(''),
		label = 'Slug',
		id = `${uid}-slug`,
		show_regenerate = true,
		onchange
	}: Props = $props();

	let is_custom_slug = $derived(slug !== '' && slug !== create_admin_slug(title));
	let has_initialized = false;
	let previous_title = '';

	$effect(() => {
		const next_title = title;
		const next_slug = slug;
		const next_generated_slug = create_admin_slug(next_title);

		if (!has_initialized) {
			has_initialized = true;
			previous_title = next_title;
			const initialized_slug = initialize_admin_slug(next_slug, next_title);
			if (initialized_slug !== next_slug) {
				slug = initialized_slug;
				onchange?.(initialized_slug);
			}
			return;
		}

		if (next_title === previous_title) {
			return;
		}

		const should_auto_update = can_auto_update_slug(next_slug, previous_title);
		previous_title = next_title;

		if (!should_auto_update || next_slug === next_generated_slug) {
			return;
		}

		slug = next_generated_slug;
		onchange?.(next_generated_slug);
	});

	function handle_slug_input(event: Event): void {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		slug = target.value;
		onchange?.(slug);
	}

	function regenerate_slug(): void {
		slug = create_admin_slug(title);
		previous_title = title;
		onchange?.(slug);
	}

	let helper_text = $derived(
		is_custom_slug
			? show_regenerate
				? 'Using custom slug. Click Regenerate to sync from title.'
				: 'Using custom slug.'
			: ''
	);
</script>

<div class="admin-field">
	<label for={id}>{label}</label>
	<div class="admin-control-row">
		<input
			{id}
			name="slug"
			type="text"
			value={slug}
			autocapitalize="off"
			autocomplete="off"
			spellcheck={false}
			oninput={handle_slug_input}
		/>
		{#if show_regenerate}
			<button type="button" data-intent="quiet" onclick={regenerate_slug}>Regenerate</button>
		{/if}
	</div>
	{#if helper_text}
		<p class="admin-field-help">{helper_text}</p>
	{/if}
</div>
