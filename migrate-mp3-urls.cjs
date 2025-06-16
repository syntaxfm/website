#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting MP3 URL migration...\n');

// Load the mapping data
const mapping_path = path.join(__dirname, 'shows', 'mapping.json');
if (!fs.existsSync(mapping_path)) {
	console.error('❌ mapping.json not found in shows directory');
	process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mapping_path, 'utf8'));
console.log(`📊 Loaded ${mapping.length} episodes from mapping.json`);

// Get all markdown files
const shows_dir = path.join(__dirname, 'shows');
const markdown_files = fs
	.readdirSync(shows_dir)
	.filter((file) => file.endsWith('.md') && file !== 'mapping.json')
	.sort();

console.log(`📁 Found ${markdown_files.length} markdown files\n`);

let migrated_count = 0;
let already_migrated_count = 0;
let not_found_count = 0;
const not_found_episodes = [];

// Function to normalize URLs for comparison
function normalizeUrl(url) {
	if (!url) return '';
	// Remove /secure/ if present and normalize
	return url
		.replace('https://traffic.libsyn.com/secure/syntax/', 'https://traffic.libsyn.com/syntax/')
		.replace('https://traffic.libsyn.com/syntax/', '');
}

// Function to extract episode number from filename
function extractEpisodeNumber(filename) {
	const match = filename.match(/^(\d+)/);
	return match ? parseInt(match[1]) : null;
}

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

// Process each markdown file
for (const filename of markdown_files) {
	const file_path = path.join(shows_dir, filename);
	const content = fs.readFileSync(file_path, 'utf8');

	const parsed = parseFrontmatter(content);
	if (!parsed) {
		console.log(`⚠️  Could not parse frontmatter for ${filename}`);
		continue;
	}

	const { frontmatter, body } = parsed;

	// Check if already migrated
	if (frontmatter.completed === 'true') {
		already_migrated_count++;
		continue;
	}

	// Extract episode info
	const episode_number = extractEpisodeNumber(filename);
	const title_from_filename = filename.replace(/^\d+\s*-\s*/, '').replace(/\.md$/, '');

	// Find matching episode in mapping
	let matching_episode = null;

	// First try to match by title
	matching_episode = mapping.find(
		(ep) => ep.title.toLowerCase().trim() === title_from_filename.toLowerCase().trim()
	);

	// If no title match, try to match by old URL (handling /secure/ variations)
	if (!matching_episode && frontmatter.url) {
		const current_url_normalized = normalizeUrl(frontmatter.url);
		matching_episode = mapping.find((ep) => {
			const old_url_normalized = normalizeUrl(ep.oldMp3);
			return current_url_normalized === old_url_normalized;
		});
	}

	// If still no match, try to match by episode number pattern in URL
	if (!matching_episode && episode_number && frontmatter.url) {
		matching_episode = mapping.find((ep) => {
			const url_pattern = `Syntax_-_${episode_number}.mp3`;
			const url_pattern_alt = `Syntax${episode_number}.mp3`;
			return ep.oldMp3.includes(url_pattern) || ep.oldMp3.includes(url_pattern_alt);
		});
	}

	if (matching_episode) {
		// Update the URL and mark as completed
		frontmatter.url = matching_episode.newMp3;
		frontmatter.completed = 'true';

		// Write the updated file
		const updated_content = rebuildFrontmatter(frontmatter, body);
		fs.writeFileSync(file_path, updated_content, 'utf8');

		console.log(`✅ Updated: ${filename}`);
		console.log(`   Old: ${matching_episode.oldMp3}`);
		console.log(`   New: ${matching_episode.newMp3}\n`);

		migrated_count++;
	} else {
		// Could not find matching episode
		not_found_episodes.push({
			filename,
			title: title_from_filename,
			currentUrl: frontmatter.url,
			episodeNumber: episode_number
		});
		not_found_count++;
		console.log(`❌ No match found for: ${filename}`);
		if (frontmatter.url) {
			console.log(`   Current URL: ${frontmatter.url}`);
		}
		console.log('');
	}
}

// Summary
console.log('\n🎉 Migration Summary:');
console.log(`✅ Successfully migrated: ${migrated_count} episodes`);
console.log(`⏭️  Already migrated: ${already_migrated_count} episodes`);
console.log(`❌ Not found: ${not_found_count} episodes`);
console.log(`📁 Total processed: ${markdown_files.length} files\n`);

// List episodes that couldn't be matched
if (not_found_episodes.length > 0) {
	console.log('📋 Episodes that could not be matched:');
	not_found_episodes.forEach((ep) => {
		console.log(`   • ${ep.filename}`);
		if (ep.currentUrl) {
			console.log(`     URL: ${ep.currentUrl}`);
		}
	});
	console.log('');
}

// Suggest manual review
if (not_found_count > 0) {
	console.log('💡 Suggestions:');
	console.log('   • Check if these episodes exist in mapping.json');
	console.log('   • Verify title matches between filenames and mapping data');
	console.log('   • Check for typos or special characters in titles');
	console.log('   • Some episodes might be missing from the mapping data');
}

console.log('\n🏁 Migration completed!');
