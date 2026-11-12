import type { Guest, Host } from '$server/db/types';

export type FaceShow = {
	guests: { guest: Pick<Guest, 'name' | 'github'> }[];
	hosts: { profile: Pick<Host, 'name' | 'username'> }[];
};

export type Face = {
	name: string;
	github: string;
	type: 'host' | 'guest';
};

export function get_faces_from_show(show: FaceShow): Face[] {
	const host_profiles: Pick<Host, 'name' | 'username'>[] =
		show.hosts?.length > 0
			? show.hosts.map((host) => host.profile)
			: [
					{ name: 'Wes Bos', username: 'wesbos' },
					{ name: 'Scott Tolinski', username: 'stolinski' }
				];

	const hosts = host_profiles.map(
		(profile): Face => ({
			// v3 never writes profile names (they came from the old users table), so a host can lack one
			name: profile.name || profile.username || '',
			github: profile.username || '',
			type: 'host'
		})
	);

	return [
		...hosts,
		...(show.guests || []).map(
			(guest): Face => ({
				name: guest.guest.name,
				github: guest.guest.github || '',
				type: 'guest'
			})
		)
	];
}

// "Wes", "Wes & Scott", "Wes, CJ & Scott"
function join_names(names: string[]): string {
	if (names.length < 2) return names.join('');
	return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
}

/**
 * Who is on an episode, in one line: hosts by first name, guests by full name.
 * "Wes, CJ & Scott", or "Wes & Scott with Ben Vinegar".
 */
export function get_people_line(faces: Face[]): string {
	const hosts = join_names(
		faces.filter((face) => face.type === 'host').map((face) => face.name.split(' ')[0])
	);
	const guests = join_names(faces.filter((face) => face.type === 'guest').map((face) => face.name));
	return guests ? `${hosts} with ${guests}` : hosts;
}
