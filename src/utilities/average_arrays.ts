export function average_arrays(arrs: number[][]) {
	const result = [];
	for (let i = 0; i < arrs[0].length; i++) {
		let sum = 0;
		for (let j = 0; j < arrs.length; j++) {
			sum += arrs[j][i];
		}
		result.push(sum / arrs.length);
	}
	return result;
}
