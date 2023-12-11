import type { ShortcutTrigger } from '@svelte-put/shortcut';

export type Hotkeys = {
	[key: string]: {
		description: string;
		trigger: ShortcutTrigger | ShortcutTrigger[];
	};
};
