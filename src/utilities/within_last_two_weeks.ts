export function is_within_last_two_weeks(provided_date: Date) {
	const two_weeks_ago = new Date();
	two_weeks_ago.setDate(two_weeks_ago.getDate() - 14);

	return provided_date >= two_weeks_ago;
}
