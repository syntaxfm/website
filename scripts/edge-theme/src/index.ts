import { parse } from 'cookie';

export default {
	async fetch(request) {
		const cookies = parse(request.headers.get('cookie') || '');
		const theme = cookies['theme'];

		const OLD_URL = 'syntax.fm';
		const NEW_URL = '127.0.0.1:8787';

		class ThemeRewriter {
			element(element) {
        if(cookies['theme'])  {
          element.setAttribute('class', `theme-${cookies['theme'] || 'system'} theme-wrapper cloudflare-edged`);
        }
			}
		}

		const url = new URL(request.url);

		const rewriter = new HTMLRewriter().on('div.theme-wrapper', new ThemeRewriter());

		const isCSSOrJS = request.url.endsWith('.css') || request.url.endsWith('.js') || request.url.endsWith('.json');

    if(url.pathname === '/about'){
      // We need to fetch and re-write the HTML
      const url = new URL(request.url);
      // url.host = OLD_URL;
      // url.port = 80;
      const res = await fetch(url);
      return rewriter.transform(res);
    }

    // Otherwise Forward to original server
    // Fetch from original Server
    // url.host = OLD_URL;
    // url.port = 80;
    // url.protocol = 'https';
		return fetch(url, request);

		// if (isCSSOrJS) {
		// 	// console.log('Fetching CSS or JS', request.url);
		// 	const res = await fetch(url.replace(NEW_URL, OLD_URL));
		// 	return res;
		// }

		// if (request.url.endsWith('/')) {
		// 	console.log('MAin entry point. Fetching syntax.fm');
		// 	const res = await fetch(`https://${OLD_URL}`);
		// 	return rewriter.transform(res);
		// }

		// // otherwise its a resource
		// console.log('Fetching resource', request.url.replace(NEW_URL, OLD_URL));
		// const res = await fetch(url.replace(NEW_URL, OLD_URL));
		// return res;
	},
};
