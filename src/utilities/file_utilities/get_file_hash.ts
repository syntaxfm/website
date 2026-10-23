import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { promisify } from 'util';
import stream from 'stream';

const pipeline = promisify(stream.pipeline);

export async function get_file_hash(file_path: string) {
	const hash = createHash('sha256');
	const read_stream = createReadStream(file_path);

	await pipeline(read_stream, hash);

	return hash.digest('hex');
}
