import type { Guest, Host, Show } from '$server/db/types';

export function get_faces_from_show(
	show: Show & { guests: { guest: Guest }[] } & { hosts: { user: Host }[] }
) {
	const host_users: Host[] =
		show.hosts?.length > 0
			? show.hosts.map((host) => host.user)
			: [
					{ name: 'Wes Bos', username: 'wesbos', twitter: null },
					{ name: 'Scott Tolinski', username: 'stolinski', twitter: null }
				];

	const hosts = host_users.map((user) => ({
		name: user.name || '',
		github: user.username || '',
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
