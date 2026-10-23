import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
	show_number: (param) => (/^[0-9]+$/.test(param) ? param : undefined)
});
