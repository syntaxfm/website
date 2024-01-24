import chroma from 'chroma-js';

export function oklchToRgba(oklch: string) {
	// Try to match the L, C, H values in the OKLCH string
	const matches = oklch.match(/\d+(\.\d+)?/g);

	// Check if matches are found
	if (matches && matches.length === 3) {
		const [l, c, h] = matches.map(Number);

		// Use Chroma.js to convert the OKLCH values to an RGBA color
		const rgba = chroma.oklch(l, c, h).rgba();

		// Format the RGBA array into a CSS string
		return `rgba(${rgba.map((v) => Math.round(v)).join(', ')})`;
	} else {
		// Handle the error or provide a default value
		console.error('Invalid OKLCH string:', oklch);
		return 'rgba(0, 0, 0, 1)'; // Default to black or some error color
	}
}

export function rgbaToHex(rgba: string): string {
	// Parse the RGBA string to extract R, G, B, and A values
	const matches = rgba.match(/\d+(\.\d+)?/g);
	if (!matches || matches.length < 3 || matches.length > 4) {
		console.error('Invalid RGBA string:', rgba);
		return ''; // Return an empty string or some error indication as needed
	}

	// Convert the extracted values to integers and ensure they are within the 0-255 range
	const [r, g, b] = matches.slice(0, 3).map((num) => Math.min(255, Math.max(0, parseInt(num))));

	// Convert each color component to a two-digit hexadecimal value
	const toHex = (value: number) => value.toString(16).padStart(2, '0').toUpperCase();

	// Combine the R, G, B, and A components into a single HEX color string
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
