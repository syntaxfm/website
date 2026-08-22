import { describe, expect, it } from 'vitest';
import { MODEL, ORCAROUTER_API_BASE } from './orcarouter';

describe('OrcaRouter provider', () => {
	it('uses the OrcaRouter API base URL', () => {
		expect(ORCAROUTER_API_BASE).toBe('https://api.orcarouter.ai/v1');
	});

	it('uses the OrcaRouter auto model', () => {
		expect(MODEL).toBe('orcarouter/auto');
	});
});
