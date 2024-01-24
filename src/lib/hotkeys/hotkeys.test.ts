import type { ShortcutTrigger } from '@svelte-put/shortcut';
import { describe, expect, it } from 'vitest';
import { formatShortcut } from './utils';

describe('Format shortcuts', () => {
	it('Simple hotkeys', () => {
		const trigger = {
			key: 'k',
			modifier: 'ctrl' as ShortcutTrigger['modifier']
		};
		expect(formatShortcut(trigger)).toBe('ctrl+k');
	});

	it('Without modifier', () => {
		const trigger = {
			key: 'k'
		};
		expect(formatShortcut(trigger)).toBe('k');
	});

	it('Should replace space key', () => {
		const trigger = {
			key: ' ',
			modifier: 'ctrl' as ShortcutTrigger['modifier']
		};
		expect(formatShortcut(trigger)).toBe('ctrl+Space');
	});

	it('Multiple modifiers', () => {
		const trigger = {
			key: 'k',
			modifier: ['ctrl', 'shift'] as ShortcutTrigger['modifier']
		};
		expect(formatShortcut(trigger)).toBe('ctrl+shift+k');
	});

	it('Multiple modifiers with arrays', () => {
		const trigger = {
			key: 'k',
			modifier: [
				['ctrl', 'shift'],
				['alt', 'shift']
			] as ShortcutTrigger['modifier']
		};
		expect(formatShortcut(trigger)).toBe('ctrl+shift or alt+shift+k');
	});

	it('Multiple shortcuts for the same action', () => {
		const shortcuts = [
			{
				key: 'k',
				modifier: 'ctrl' as ShortcutTrigger['modifier']
			},
			{
				key: 'k',
				modifier: 'alt' as ShortcutTrigger['modifier']
			}
		];

		expect(formatShortcut(shortcuts)).toBe('ctrl+k or alt+k');
	});
});
