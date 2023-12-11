import { is_within_last_two_weeks } from './within_last_two_weeks';

export function get_show_cache_s(provided_date: Date) {
	return is_within_last_two_weeks(provided_date) ? 600 : 3600;
}
