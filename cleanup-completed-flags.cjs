#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Removing completed flags from all markdown files...\n');

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

// Get all markdown files
const shows_dir = path.join(__dirname, 'shows');
const markdown_files = fs
	.readdirSync(shows_dir)
	.filter((file) => file.endsWith('.md'))
	.sort();

let cleaned_count = 0;
let no_completed_count = 0;

for (const filename of markdown_files) {
	const file_path = path.join(shows_dir, filename);
	const content = fs.readFileSync(file_path, 'utf8');

	const parsed = parseFrontmatter(content);
	if (!parsed) {
		console.log(`⚠️  Could not parse frontmatter for ${filename}`);
		continue;
	}

	const { frontmatter, body } = parsed;

	// Check if completed property exists
	if (frontmatter.completed) {
		// Remove the completed property
		delete frontmatter.completed;

		// Write the updated file
		const updated_content = rebuildFrontmatter(frontmatter, body);
		fs.writeFileSync(file_path, updated_content, 'utf8');

		console.log(`✅ Cleaned: ${filename}`);
		cleaned_count++;
	} else {
		no_completed_count++;
	}
}

console.log(`\n🎉 Cleanup Summary:`);
console.log(`✅ Cleaned files: ${cleaned_count}`);
console.log(`➖ Files without completed flag: ${no_completed_count}`);
console.log(`📁 Total processed: ${markdown_files.length} files`);
console.log(`\n🏁 All completed flags have been removed!`);
