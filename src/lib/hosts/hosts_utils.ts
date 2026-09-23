import type { Guest, Host, Show } from '$server/db/types';

export function get_faces_from_show(
	show: Show & { guests: { guest: Guest }[] } & { hosts: { profile: Host }[] }
) {
	const host_profiles: Host[] =
		show.hosts?.length > 0
			? show.hosts.map((host) => host.profile)
			: [
					{ name: 'Wes Bos', username: 'wesbos', twitter: null },
					{ name: 'Scott Tolinski', username: 'stolinski', twitter: null }
				];

	const hosts = host_profiles.map((profile) => ({
		name: profile.name || '',
		github: profile.username || '',
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
