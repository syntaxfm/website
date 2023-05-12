import { createHash } from 'crypto';

export async function get_hash_from_content(content: string) {
	return createHash('sha256').update(content).digest('hex');
}
