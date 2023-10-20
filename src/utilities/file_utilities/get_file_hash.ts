import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { promisify } from 'util';
import stream from 'stream';

const pipeline = promisify(stream.pipeline);

export async function get_file_hash(file_path: string) {
	const hash = createHash('sha256');
	const readStream = createReadStream(file_path);

	await pipeline(readStream, hash);

	return hash.digest('hex');
}
