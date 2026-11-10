import { get_local_storage } from '$utilities/storage';

// Pages are the same for every visitor, so who is signed in is only known once the page's scripts
// have asked. An admin's browser remembers that they are one: app.html reads this before the first
// paint and marks the page, which keeps room for the admin menu (admin.css) so the page doesn't
// jump down when the menu arrives.
const STORAGE_KEY = 'is_admin'; // Also read in app.html
const PAGE_CLASS = 'is-admin';

export function was_admin(): boolean {
	return get_local_storage()?.getItem(STORAGE_KEY) === '1';
}

export function remember_admin(is_admin: boolean) {
	const storage = get_local_storage();
	if (is_admin) storage?.setItem(STORAGE_KEY, '1');
	else storage?.removeItem(STORAGE_KEY);
	document.documentElement.classList.toggle(PAGE_CLASS, is_admin);
}
