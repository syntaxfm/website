import type { Guest, Host, Show } from '$server/db/types';

export function get_faces_from_show(
	show: Show & { guests: { guest: Guest }[] } & { hosts: Host[] }
) {
	let hosts = (
		show.hosts?.length > 0
			? show.hosts
			: [
					{ name: 'Wes Bos', username: 'wesbos' },
					{ name: 'Scott Tolinski', username: 'stolinski' }
				]
	).map((host) => ({
		name: host.name || '',
		github: host.username || '',
		type: 'host'
	}));

	return [
		...hosts,
		...(show.guests || []).map((guest) => ({
			name: guest.guest.name,
			github: guest.guest.github || '',
			type: 'guest'
		}))
	];
}
