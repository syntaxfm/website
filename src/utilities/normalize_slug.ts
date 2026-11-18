import get_slug from 'speakingurl';

// A URL slug from any text: lowercase words joined by dashes, symbols dropped, at most max_length
// characters. Empty when the text has nothing a slug can keep.
export function normalize_slug(input_text: string, max_length: number) {
	return get_slug(input_text, {
		separator: '-',
		truncate: max_length,
		symbols: false
	});
}
