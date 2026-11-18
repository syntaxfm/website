#!/usr/bin/env node
// Prints the SQL that loads the curated topic list (scripts/tag-topics.json) as TOPIC tags, for the
// tag engine (src/server/tags). A topic with the same name or slug as an existing tag takes over that
// row, so its /tags URL and content stay. Safe to run again: it only updates kind and description.
//
//   node scripts/tag-topics-sql.js > /tmp/topics.sql
//   then apply it in one transaction (psql --single-transaction -f /tmp/topics.sql)
//
// After the first load, topics are edited in /admin/tags, not here.
import { readFileSync } from 'node:fs';

const topics = JSON.parse(readFileSync(new URL('./tag-topics.json', import.meta.url), 'utf8'));

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

const statements = topics.flatMap(({ slug, name, description }) => {
	if (!slug || !name || !description) throw new TypeError(`Topic is missing a field: ${slug}`);
	const match = `lower(name) = lower(${quote(name)}) or slug = ${quote(slug)}`;
	return [
		`update tags set kind = 'TOPIC', description = ${quote(description)} where id = (select id from tags where ${match} order by lower(name) = lower(${quote(name)}) desc limit 1);`,
		`insert into tags (name, slug, kind, description) select ${quote(name)}, ${quote(slug)}, 'TOPIC', ${quote(description)} where not exists (select 1 from tags where ${match});`
	];
});

console.log(statements.join('\n'));
