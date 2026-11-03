// localStorage, or null on the server and when the browser blocks site data (reading it throws)
export function get_local_storage(): Storage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}
