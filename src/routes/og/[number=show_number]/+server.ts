import satori from 'satori';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { html as toReactNode } from 'satori-html';
import Template__SvelteComponent_ from './Template.svelte';
import type { SvelteComponent } from 'svelte';

interface MyComponent extends SvelteComponent {
	props: {
		number: string;
	};
}

const temp = Template__SvelteComponent_ as unknown as MyComponent;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontPath = path.join(__dirname, '../../../../static/fonts/MDIO0.6-Italic.woff');
const fontArrayBuf = await fs.readFile(fontPath);
console.log(temp);
const result = temp.render();
const element = toReactNode(`${result.html}<style>${result.css.code}</style>`);
console.log('element', element);

const width = 1200;
const height = 630;

export const GET = async () => {
	const html = {
		type: 'div',
		props: {
			children: 'hello world',
			style: {
				color: 'red'
			}
		}
	};
	const svg = await satori(element, {
		fonts: [
			{
				name: 'MDIO0.6',
				data: Buffer.from(fontArrayBuf),
				style: 'normal'
			}
		],
		width,
		height
	});

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: width
		}
	});

	const image = resvg.render();

	return new Response(image.asPng(), {
		headers: {
			'content-type': 'image/png'
		}
	});
};
