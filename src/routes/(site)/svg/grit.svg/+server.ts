let isDark = false;
let w = 1000;
let h = 1000;
let count = 100;

function rando(under: number, lower?: number) {
	const minimum = lower ?? 0;
	return Math.random() * (under - minimum) + minimum;
}

const grits = [
	'M1,2 C1.6,2 2,1.6 2,1 C2,0.4 1.6,0 1,0 C0.4,0 0,0.4 0,1 C0,1.6 0.4,2 1,2 Z',
	'M2.857,4 C4.381,4 6.286,3 6.857,2 L8,0 L5.143,0 C3.619,0 1.714,0.8 1.143,2 L0,4 L2.857,4 Z',
	'M3.238,4 C3.619,4 4,3 4,2 L4,0 L1.905,0 L0,0 L1.143,2 C1.714,3 2.667,4 3.238,4 Z',
	'M2.391,3.48892289 C3.913,2.62492289 5,1.54592289 5,0.89792289 C5,-0.82807711 3.043,0.03492289 1.522,2.62492289 L0,4.99992289 L2.391,3.48892289 Z',
	'M0,5 L1.615,3.846 L3,2.5 L1.615,1.154 L0,0 L0,2.5 Z',
	'M2.5,3 L3.846,1.615 L5,0 L2.5,0 L0,0 L1.154,1.615 Z',
	'M4,6 L2.8,3.077 C1.4,-0.429 0,-1.014 0,1.713 C0,2.882 0.8,4.246 2,4.831 L4,6 Z',
	'M3,9 L5,7.085 L7,5.17 L6,2.489 L5,0 L4.8,3.447 L4.6,6.894 L2.2,5.553 L0,4.213 L1.6,6.511 Z',
	'M3.238,4 C3.619,4 4,3 4,2 L4,0 L1.905,0 L0,0 L1.143,2 C1.714,3 2.667,4 3.238,4 Z',
	'M10,5.949 L10,3.077 L10,0 L8.2,0 C7.4,0 6.6,1.026 6.6,2.256 L6.6,4.513 L3.4,3.282 L0,2.051 L2.4,4.923 L4.8,8 L7.4,6.974 L10,5.949 Z'
];

function render() {
	return `<?xml version="1.0" encoding="UTF-8"?>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <g id="Grit-Parts">
    ${Array.from({ length: count })
			.map(() => {
				const x = rando(w);
				const y = rando(h);
				return `<path transform="scale(${rando(2, 0.5)} ${rando(2, 0.5)}) rotate(${rando(
					360
				)} ${x} ${y}) translate(${x},${y})" d="${grits.at(rando(grits.length))}" fill="${
					isDark ? `rgba(255,255,255,${rando(1)})` : `rgba(0,0,0,${rando(1)})`
				}"></path>`;
			})
			.join('')}
</g>
		</svg>
	`;
}

export function GET({ request, url }) {
	isDark = !!url.searchParams.has('dark');
	w = parseInt(url.searchParams.get('w') || '1000');
	h = parseInt(url.searchParams.get('h') || '1000');
	count = parseInt(url.searchParams.get('count') || '100');

	const svg = render();
	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml',
			'cache-control': 'private, max-age=3600'
		}
	});
}
