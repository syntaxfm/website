// Humanize SCREAMING_SNAKE enum values for display (e.g. `SUPPER` -> `Supper Club`).
// Lives in the shared utils pool because content/show/submission lists all surface
// the same raw enums and must render them identically.

const ENUM_LABEL_OVERRIDES: Record<string, string> = {
	SUPPER: 'Supper Club',
	OSS: 'Open Source',
	AI: 'AI'
};

export function humanize_enum(value: string | null | undefined): string {
	if (!value) {
		return '';
	}

	if (ENUM_LABEL_OVERRIDES[value]) {
		return ENUM_LABEL_OVERRIDES[value];
	}

	return value
		.toLowerCase()
		.split(/[_\s]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
