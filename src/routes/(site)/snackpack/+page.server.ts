export type Broadcast = {
	id: number;
	publication_id: string;
	created_at: string;
	subject: string;
	description: string;
	content: string;
	public: boolean;
	published_at: string | null;
	send_at: string | null;
	thumbnail_alt: string | null;
	thumbnail_url: string | null;
	email_address: string;
	email_layout_template: string;
};

export const load = async function ({ setHeaders }) {
	// 1 min cache with 1 min stale allowed. Issue data is fetched via the
	// `get_newsletter_archive` remote query, so the page document itself is cheap.
	setHeaders({
		'cache-control': `public, s-maxage=60, stale-while-revalidate=60`
	});

	return {
		meta: {
			title: 'Syntax Newsletter • Tips, tricks, swag drops and more'
		}
	};
};
