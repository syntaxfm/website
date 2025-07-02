#!/usr/bin/env node
/* eslint-env node */
/* eslint no-undef: "off" */
/* global console, __dirname, process */

const fs = require('fs');
const path = require('path');

// Set to true to preview changes without making them
const DRY_RUN = false;

console.log('🚀 Starting MP3 URL migration...\n');
if (DRY_RUN) {
	console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

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

// Function to extract current URL from content
function extractCurrentUrl(content) {
	const urlMatch = content.match(
		/^url: (https:\/\/traffic\.libsyn\.com\/(?:secure\/)?syntax\/.+)$/m
	);
	return urlMatch ? urlMatch[1] : null;
}

// Function to check if already completed
function isAlreadyCompleted(content) {
	return /^completed: true$/m.test(content);
}

// Function to replace URL line only
function replaceUrlLine(content, oldUrl, newUrl) {
	// Only replace lines that start with "url: https://traffic.libsyn.com"
	const urlPattern = new RegExp(`^url: ${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');

	if (!urlPattern.test(content)) {
		return null; // URL pattern not found
	}

	// Replace the URL line and add completed flag if not present
	let updatedContent = content.replace(urlPattern, `url: ${newUrl}`);

	// Add completed flag after the frontmatter section if not already present
	// if (!isAlreadyCompleted(updatedContent)) {
	// 	// Find the end of frontmatter and add completed flag
	// 	updatedContent = updatedContent.replace(/(---\n[\s\S]*?)(\n---)/, `$1\ncompleted: true$2`);
	// }

	return updatedContent;
}

// Process each markdown file
for (const filename of markdown_files) {
	const file_path = path.join(shows_dir, filename);
	const content = fs.readFileSync(file_path, 'utf8');

	// Check if already migrated
	if (isAlreadyCompleted(content)) {
		already_migrated_count++;
		continue;
	}

	// Extract current URL
	const currentUrl = extractCurrentUrl(content);
	if (!currentUrl) {
		console.log(`⚠️  No URL found in ${filename}`);
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
	if (!matching_episode) {
		const current_url_normalized = normalizeUrl(currentUrl);
		matching_episode = mapping.find((ep) => {
			const old_url_normalized = normalizeUrl(ep.oldMp3);
			return current_url_normalized === old_url_normalized;
		});
	}

	// If still no match, try to match by episode number pattern in URL
	if (!matching_episode && episode_number) {
		matching_episode = mapping.find((ep) => {
			const url_pattern = `Syntax_-_${episode_number}.mp3`;
			const url_pattern_alt = `Syntax${episode_number}.mp3`;
			return ep.oldMp3.includes(url_pattern) || ep.oldMp3.includes(url_pattern_alt);
		});
	}

	if (matching_episode) {
		// Replace only the URL line
		const updated_content = replaceUrlLine(content, currentUrl, matching_episode.newMp3);

		if (updated_content) {
			// Write the updated file
			if (!DRY_RUN) {
				fs.writeFileSync(file_path, updated_content, 'utf8');
			}

			console.log(`✅ ${DRY_RUN ? 'Would update' : 'Updated'}: ${filename}`);
			console.log(`   Old: ${currentUrl}`);
			console.log(`   New: ${matching_episode.newMp3}\n`);

			migrated_count++;
		} else {
			console.log(`⚠️  Could not replace URL in ${filename} - pattern not found`);
		}
	} else {
		// Could not find matching episode
		not_found_episodes.push({
			filename,
			title: title_from_filename,
			currentUrl: currentUrl,
			episodeNumber: episode_number
		});
		not_found_count++;
		console.log(`❌ No match found for: ${filename}`);
		console.log(`   Current URL: ${currentUrl}`);
		console.log('');
	}
}

// Summary
console.log(`\n🎉 Migration Summary${DRY_RUN ? ' (DRY RUN)' : ''}:`);
console.log(
	`✅ ${DRY_RUN ? 'Would migrate' : 'Successfully migrated'}: ${migrated_count} episodes`
);
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

console.log(
	`\n🏁 ${DRY_RUN ? 'Dry run completed! Set DRY_RUN = false to perform actual migration.' : 'Migration completed!'}`
);
