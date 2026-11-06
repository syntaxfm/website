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

export const load = async function () {
	return {
		meta: {
			title: 'Syntax Newsletter • Tips, tricks, swag drops and more'
		}
	};
};
