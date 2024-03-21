export function get_first_paragraph(str: string) {
	// Split the string into an array of paragraphs
	const paragraphs = str.split('\n\n');

	// Return the first paragraph if it exists, otherwise return an empty string
	return paragraphs.length > 0 ? paragraphs[0] : '';
}
