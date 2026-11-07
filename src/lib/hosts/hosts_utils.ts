import type { Guest, Host } from '$server/db/types';

export type FaceShow = {
	guests: { guest: Pick<Guest, 'name' | 'github'> }[];
	hosts: { profile: Pick<Host, 'name' | 'username'> }[];
};

export function get_faces_from_show(show: FaceShow) {
	const host_profiles: Pick<Host, 'name' | 'username'>[] =
		show.hosts?.length > 0
			? show.hosts.map((host) => host.profile)
			: [
					{ name: 'Wes Bos', username: 'wesbos' },
					{ name: 'Scott Tolinski', username: 'stolinski' }
				];

	const hosts = host_profiles.map((profile) => ({
		// v3 never writes profile names (they came from the old users table), so a host can lack one
		name: profile.name || profile.username || '',
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
