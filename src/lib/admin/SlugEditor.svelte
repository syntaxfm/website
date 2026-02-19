<script lang="ts">
	import get_slug from 'speakingurl';

	interface Props {
		title?: string;
		slug?: string;
		label?: string;
		show_regenerate?: boolean;
	}

	let {
		title = $bindable(''),
		slug = $bindable(''),
		label = 'Slug',
		show_regenerate = true
	}: Props = $props();

	let is_custom_slug = $state(false);

	function create_slug(input: string): string {
		return get_slug(input, {
			separator: '-',
			truncate: 120,
			symbols: false
		});
	}

	let auto_slug = $derived(create_slug(title));

	$effect(() => {
		title;
		if (is_custom_slug) {
			return;
		}

		slug = auto_slug;
	});

	function handle_slug_input(event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		slug = target.value;
		is_custom_slug = true;
	}

	function regenerate_slug() {
		slug = create_slug(title);
		is_custom_slug = false;
	}

	let helper_text = $derived(
		is_custom_slug
			? show_regenerate
				? 'Using custom slug. Click Regenerate to sync from title.'
				: 'Using custom slug.'
			: ''
	);
</script>

<div class="stack" style:--stack-gap="var(--pad-xsmall)">
	<label for="slug-input" class="fs-2">{label}</label>
	<div class="flex" style:--flex-gap="var(--pad-small)">
		<input
			id="slug-input"
			name="slug"
			type="text"
			value={slug}
			autocapitalize="off"
			autocomplete="off"
			spellcheck={false}
			oninput={handle_slug_input}
		/>
		{#if show_regenerate}
			<button type="button" onclick={regenerate_slug}>Regenerate</button>
		{/if}
	</div>
	{#if helper_text}
		<p class="fs-1">{helper_text}</p>
	{/if}
</div>
