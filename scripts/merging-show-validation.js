import { exec } from 'child_process';
import fs from 'fs/promises';
import http from 'http';
import https from 'https';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Function to check URL availability
const checkUrl = (url) =>
	new Promise((resolve) => {
		const protocol = url.startsWith('https') ? https : http;
		protocol
			.get(url, { method: 'HEAD' }, (res) => {
				resolve(res.statusCode === 200);
			})
			.on('error', () => {
				resolve(false); // Assuming unreachable if an error occurs
			});
	});

// Function to extract URLs from markdown content
const extractUrls = (content) => {
	const urlRegex = /https?:\/\/[^\s\)]+/g;
	return content.match(urlRegex) || [];
};

// Function to process a single markdown file for broken links
const processFile = async (filePath) => {
	const content = await fs.readFile(filePath, 'utf8');
	const urls = extractUrls(content);
	const checkPromises = urls.map(checkUrl);
	const results = await Promise.all(checkPromises);
	return urls.filter((_, index) => !results[index]);
};

// Function to get new .md files added in the PR
const getNewMarkdownFiles = async () => {
	const { stdout } = await execAsync(
		"git diff --diff-filter=A --name-only HEAD $(git merge-base HEAD main) '*.md'"
	);
	return stdout.split('\n').filter((line) => line.endsWith('.md'));
};

// Main function to check only new .md files for broken links
const main = async () => {
	const newFiles = await getNewMarkdownFiles();
	if (newFiles.length === 0) {
		console.log('No new markdown files to check.');
		return;
	}
	let hasBrokenLinks = false;
	for (const file of newFiles) {
		const brokenLinks = await processFile(file);
		if (brokenLinks.length > 0) {
			hasBrokenLinks = true;
			console.log(`Broken links found in ${file}:`);
			brokenLinks.forEach((link) => console.log(`- ${link}`));
		}
	}
	if (hasBrokenLinks) {
		process.exit(1);
	}
};

await main();
