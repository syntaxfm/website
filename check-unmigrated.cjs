#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for unmigrated episodes...\n');

// Function to parse frontmatter
function parseFrontmatter(content) {
	const frontmatter_match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!frontmatter_match) return null;

	const [, frontmatter_text] = frontmatter_match;
	const frontmatter = {};

	frontmatter_text.split('\n').forEach((line) => {
		const colon_index = line.indexOf(':');
		if (colon_index > 0) {
			const key = line.substring(0, colon_index).trim();
			const value = line.substring(colon_index + 1).trim();
			frontmatter[key] = value;
		}
	});

	return frontmatter;
}

// Get all markdown files
const shows_dir = path.join(__dirname, 'shows');
const markdown_files = fs
	.readdirSync(shows_dir)
	.filter((file) => file.endsWith('.md'))
	.sort();

const unmigrated_episodes = [];

for (const filename of markdown_files) {
	const file_path = path.join(shows_dir, filename);
	const content = fs.readFileSync(file_path, 'utf8');

	const frontmatter = parseFrontmatter(content);
	if (!frontmatter) continue;

	// Check if NOT completed
	if (frontmatter.completed !== 'true') {
		unmigrated_episodes.push({
			filename,
			number: frontmatter.number,
			title: frontmatter.title,
			url: frontmatter.url
		});
	}
}

console.log(`📊 Found ${unmigrated_episodes.length} unmigrated episodes:\n`);

unmigrated_episodes.forEach((ep) => {
	console.log(`📄 ${ep.filename}`);
	console.log(`   Number: ${ep.number || 'N/A'}`);
	console.log(`   Title: ${ep.title || 'N/A'}`);
	console.log(`   URL: ${ep.url || 'N/A'}`);
	console.log('');
});

if (unmigrated_episodes.length === 0) {
	console.log('🎉 All episodes have been migrated!');
} else {
	console.log(`💡 These ${unmigrated_episodes.length} episodes need manual review:`);
	console.log('   • Check if they exist in mapping.json');
	console.log('   • Verify URL patterns match');
	console.log('   • Some may have guest URLs instead of MP3 URLs');
	console.log('   • Some may be missing from the mapping data entirely');
}
