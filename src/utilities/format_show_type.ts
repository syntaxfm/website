export function format_show_type(show_type: 'HASTY' | 'TASTY' | 'SUPPER' | 'SPECIAL') {
	// Format the show type for display
	if (show_type === 'HASTY') return 'Hasty';
	if (show_type === 'TASTY') return 'Tasty';
	if (show_type === 'SUPPER') return 'Supper Club';
	return 'Special';
}
