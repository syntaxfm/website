// Match one part of the duration string at a time and pad with 0
// Avoids a complex / hard to understand regex for matching all parts at once
function parseTime(duration: string, part: 'H' | 'M' | 'S') {
	const match = duration.match(new RegExp(`(\\d+)${part}`));
	return match ? match[1].padStart(1, '0') : '00';
}

// Parses duration from YouTube duration format (ISO 8601) e.g. PT1H14M28S to 01:14:28
export default function parseDuration(duration: string) {
	const hours = parseTime(duration, 'H');
	const minutes = parseTime(duration, 'M');
	const seconds = parseTime(duration, 'S');

	const result = `${minutes}:${seconds}`;
	return hours !== '00' ? `${hours}:${duration}` : result;
}
