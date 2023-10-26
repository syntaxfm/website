import type { Hotkeys } from './types';
import type { ShortcutTrigger } from '@svelte-put/shortcut';

export function getHotkeyTrigger(hotkey: keyof typeof hotkeys, hotkeys: Hotkeys) {
	return hotkeys[hotkey].trigger;
}

// This function will turn the hotkey object into a string that can be consumed in the UI
export function formatShortcut(
	shortcut: Partial<ShortcutTrigger> | Partial<ShortcutTrigger[]>
): string {
	if (!shortcut) return '';

	if (Array.isArray(shortcut)) {
		const result = shortcut.map((s) => (s ? formatSingleShortcut(s) : '')).join(' or ');
		return result;
	} else {
		return formatSingleShortcut(shortcut);
	}
}

export function formatSingleShortcut(shortcut: Partial<ShortcutTrigger>): string {
	let formattedShortcut = '';

	// replace the space key with "Space"
	if (shortcut.key === ' ') {
		shortcut.key = 'Space';
	}

	if (shortcut.modifier) {
		if (typeof shortcut.modifier === 'string') {
			formattedShortcut = shortcut.modifier;
		} else if (Array.isArray(shortcut.modifier[0])) {
			formattedShortcut = shortcut.modifier
				.map((mod) => {
					if (Array.isArray(mod)) {
						return mod.join('+');
					}
					return mod;
				})
				.join(' or ');
		} else {
			formattedShortcut = (shortcut.modifier as string[]).join('+');
		}

		formattedShortcut += '+' + shortcut.key;
		return formattedShortcut;
	}

	formattedShortcut += shortcut.key;
	return formattedShortcut;
}
