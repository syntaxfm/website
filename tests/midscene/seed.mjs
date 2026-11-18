import process from 'node:process';
import { URL } from 'node:url';
import 'dotenv/config';
import { PrismaClient, ShowType } from '@prisma/client';

// Only an explicitly named disposable database may receive this fixture.
const url = new URL(process.env.DATABASE_URL || '');
if (url.pathname !== '/syntax_midscene') {
	throw new Error('Use a disposable database named syntax_midscene for this suite.');
}
const prisma = new PrismaClient();
try {
	const show = {
		id: 'midscene-timestamp-sharing',
		number: 9999,
		title: 'Timestamp Sharing Test',
		date: new Date('2024-01-01T00:00:00Z'),
		url: 'http://127.0.0.1:4181/midscene-fixture.wav',
		youtube_url: null,
		show_notes:
			'## Show Notes\n\nA deterministic audio fixture for timestamp sharing.\n\n- [01:00](#t=01:00) Sharing a moment\n',
		hash: 'midscene-timestamp-sharing',
		slug: 'timestamp-sharing-test',
		md_file: 'midscene-timestamp-sharing.md',
		show_type: ShowType.TASTY
	};
	await prisma.show.upsert({ where: { number: show.number }, create: show, update: show });
} finally {
	await prisma.$disconnect();
}
