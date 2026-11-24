import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { assert_episode_can_publish } from './episode_publishing';

function refusal(episode: Parameters<typeof assert_episode_can_publish>[0]): string | null {
	try {
		assert_episode_can_publish(episode);
		return null;
	} catch (refused) {
		if (isHttpError(refused)) return refused.body.message;
		throw refused;
	}
}

describe('assert_episode_can_publish', () => {
	it('lets a draft or an archived episode wait for its number and audio', () => {
		expect(refusal({ status: 'DRAFT', number: null, url: null })).toBeNull();
		expect(refusal({ status: 'ARCHIVED', number: null, url: null })).toBeNull();
	});

	it('publishes an episode with its number and audio', () => {
		expect(refusal({ status: 'PUBLISHED', number: 0, url: 'https://example.com/0.mp3' })).toBeNull();
	});

	it('refuses publishing without a number, or without audio', () => {
		const needs = 'needs an episode number and an audio URL';
		expect(refusal({ status: 'PUBLISHED', number: null, url: 'https://example.com/a.mp3' })).toContain(
			needs
		);
		expect(refusal({ status: 'PUBLISHED', number: 1058, url: null })).toContain(needs);
		expect(refusal({ status: 'PUBLISHED', number: 1058, url: '  ', title: 'Draft' })).toBe(
			'“Draft” needs an episode number and an audio URL before it can be published'
		);
	});
});
