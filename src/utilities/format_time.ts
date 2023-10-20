export default function format_time(time: number) {
	// Hours, minutes and seconds
	const hrs = Math.floor(~~(time / 3600)); // eslint-disable-line
	const mins = Math.floor(~~((time % 3600) / 60)); // eslint-disable-line
	const secs = Math.floor(time % 60);

	// Output like "1:01" or "4:03:59" or "123:03:59"
	let ret = '';

	if (hrs > 0) {
		ret += `${hrs}:${mins < 10 ? '0' : ''}`;
	}

	ret += `${mins}:${secs < 10 ? '0' : ''}`;
	ret += `${secs}`;
	return ret;
}

export function tsToS(timestamp: string): number {
	const parts = timestamp.split(':').map(parseFloat);
	let [hours, minutes, seconds] = parts;
	if (parts.length === 2) {
		seconds = minutes;
		minutes = hours;
		hours = 0;
	}

	return hours * 60 * 60 + minutes * 60 + seconds;
}
