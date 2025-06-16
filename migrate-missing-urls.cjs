#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Finding episodes with incorrect URLs...\n');

// Load the mapping data
const mapping_path = path.join(__dirname, 'shows', 'mapping.json');
const mapping = JSON.parse(fs.readFileSync(mapping_path, 'utf8'));

// Function to parse frontmatter
function parseFrontmatter(content) {
	const frontmatter_match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!frontmatter_match) return null;

	const [, frontmatter_text, body_text] = frontmatter_match;
	const frontmatter = {};

	frontmatter_text.split('\n').forEach((line) => {
		const colon_index = line.indexOf(':');
		if (colon_index > 0) {
			const key = line.substring(0, colon_index).trim();
			const value = line.substring(colon_index + 1).trim();
			frontmatter[key] = value;
		}
	});

	return { frontmatter, body: body_text };
}

// Function to rebuild frontmatter
function rebuildFrontmatter(frontmatter, body) {
	const frontmatter_lines = ['---'];
	Object.entries(frontmatter).forEach(([key, value]) => {
		frontmatter_lines.push(`${key}: ${value}`);
	});
	frontmatter_lines.push('---');
	return frontmatter_lines.join('\n') + '\n' + body;
}

// Function to extract episode number from title
function extractEpisodeNumberFromTitle(title) {
	const match = title.match(/^(\d+):/);
	return match ? parseInt(match[1]) : null;
}

// Get all unmigrated markdown files
const shows_dir = path.join(__dirname, 'shows');
const markdown_files = fs
	.readdirSync(shows_dir)
	.filter((file) => file.endsWith('.md'))
	.sort();

let fixed_count = 0;
const still_not_found = [];

for (const filename of markdown_files) {
	const file_path = path.join(shows_dir, filename);
	const content = fs.readFileSync(file_path, 'utf8');

	const parsed = parseFrontmatter(content);
	if (!parsed) continue;

	const { frontmatter, body } = parsed;

	// Skip if already migrated
	if (frontmatter.completed === 'true') continue;

	// Try to find by episode number
	let matching_episode = null;

	if (frontmatter.number) {
		const episode_num = parseInt(frontmatter.number);
		matching_episode = mapping.find((ep) => {
			const title_episode_num = extractEpisodeNumberFromTitle(ep.title);
			return title_episode_num === episode_num;
		});
	}

	// If still no match, try partial title matching
	if (!matching_episode && frontmatter.title) {
		const clean_title = frontmatter.title.toLowerCase().trim();
		matching_episode = mapping.find((ep) => {
			const mapping_title = ep.title.toLowerCase();
			// Remove episode number prefix from mapping title for comparison
			const clean_mapping_title = mapping_title.replace(/^\d+:\s*/, '').trim();
			return (
				clean_mapping_title.includes(clean_title.substring(0, 30)) ||
				clean_title.includes(clean_mapping_title.substring(0, 30))
			);
		});
	}

	if (matching_episode) {
		console.log(`✅ Found match for: ${filename}`);
		console.log(`   Episode ${frontmatter.number}: ${frontmatter.title}`);
		console.log(`   Old URL (wrong): ${frontmatter.url}`);
		console.log(`   New MP3 URL: ${matching_episode.newMp3}`);

		// Update the URL and mark as completed
		frontmatter.url = matching_episode.newMp3;
		frontmatter.completed = 'true';

		// Write the updated file
		const updated_content = rebuildFrontmatter(frontmatter, body);
		fs.writeFileSync(file_path, updated_content, 'utf8');

		fixed_count++;
		console.log(`   ✅ Updated!\n`);
	} else {
		still_not_found.push({
			filename,
			number: frontmatter.number,
			title: frontmatter.title,
			url: frontmatter.url
		});
	}
}

console.log(`\n🎉 Summary:`);
console.log(`✅ Fixed: ${fixed_count} episodes`);
console.log(`❌ Still not found: ${still_not_found.length} episodes\n`);

if (still_not_found.length > 0) {
	console.log('📋 Episodes still requiring manual review:');
	still_not_found.forEach((ep) => {
		console.log(`   • ${ep.filename} (Episode ${ep.number})`);
		console.log(`     Title: ${ep.title}`);
		console.log(`     URL: ${ep.url}`);
		console.log('');
	});
}
