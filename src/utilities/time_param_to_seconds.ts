export function time_param_to_seconds(time: string) {
	const parts = time.split(':').map(Number);
	let seconds = 0;

	// Depending on the number of parts, calculate the total seconds
	if (parts.length === 3) {
		// hh:mm:ss format
		seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
	} else if (parts.length === 2) {
		// mm:ss format
		seconds = parts[0] * 60 + parts[1];
	} else if (parts.length === 1) {
		// ss format
		seconds = parts[0];
	}

	return seconds;
}
