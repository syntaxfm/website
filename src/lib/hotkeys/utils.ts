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
	let formatted_shortcut = '';

	// replace the space key with "Space"
	if (shortcut.key === ' ') {
		shortcut.key = 'Space';
	}

	if (shortcut.modifier) {
		if (typeof shortcut.modifier === 'string') {
			formatted_shortcut = shortcut.modifier;
		} else if (Array.isArray(shortcut.modifier[0])) {
			formatted_shortcut = shortcut.modifier
				.map((mod) => {
					if (Array.isArray(mod)) {
						return mod.join('+');
					}
					return mod;
				})
				.join(' or ');
		} else {
			formatted_shortcut = (shortcut.modifier as string[]).join('+');
		}

		formatted_shortcut += '+' + shortcut.key;
		return formatted_shortcut;
	}

	formatted_shortcut += shortcut.key;
	return formatted_shortcut;
}
