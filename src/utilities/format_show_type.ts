export function format_show_type(show_date: Date) {
	// Check if the show is released on monday
	if (show_date.getDay() === 1) return 'Hasty';
	if (show_date.getDay() === 3) return 'Tasty';
	if (show_date.getDay() === 5) return 'Supper Club';
	return 'Special';
}
