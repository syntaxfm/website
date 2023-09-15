import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { html as toReactNode } from 'satori-html';
import Template__SvelteComponent_ from './Template.svelte';
import type { SvelteComponent } from 'svelte';

interface MyComponent extends SvelteComponent {
	props: {
		number: string;
	};
}

const temp = Template__SvelteComponent_ as unknown as MyComponent;

export const GET = async ({ fetch, locals, params }) => {
	const show = await locals.prisma.show.findUnique({
		where: {
			number: parseInt(params.number)
		}
	});

	const fontFile = await fetch('/fonts/MDIO-Italic.woff');
	const fontData: ArrayBuffer = await fontFile.arrayBuffer();
	const result = temp.render({
		show
	});
	const element = toReactNode(`${result.html}<style>${result.css.code}</style>`);

	const width = 1200;
	const height = 630;

	const svg = await satori(element, {
		fonts: [
			{
				name: 'MDIO',
				data: Buffer.from(fontData),
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
