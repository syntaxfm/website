import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';
// import path from 'path';
const execAsync = promisify(exec);

async function setup() {
	// Fetch all branches to ensure all references are up to date
	await execAsync('git fetch --all');
}

// Function to check URL availability
async function isUrlValid(url) {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
			}
		});
		// Consider valid if the status code is in the range 200-399, covering success and redirection
		return response.status !== 404;
	} catch (error) {
		console.error(`Error checking URL: ${url}`, error);
		return false; // Treat any error as an invalid URL
	}
}

// Function to extract URLs from markdown content
const extractUrls = (content) => {
	const urlRegex = /https?:\/\/[^\s\)]+/g;
	return content.match(urlRegex) || [];
};

// Function to process a single markdown file for broken links
const processFile = async (filePath) => {
	const content = await fs.readFile(filePath, 'utf8');
	const urls = extractUrls(content);
	const checkPromises = urls.map(isUrlValid);
	const results = await Promise.all(checkPromises);
	return urls.filter((_, index) => !results[index]);
};
// Function to get new files added in the PR within ./shows directory
const getNewFilesInShows = async () => {
	await setup(); // Make sure all branches are fetched
	const baseBranch = process.env.GITHUB_BASE_REF; // Use the base branch of the PR
	const { stdout } = await execAsync(
		`git diff --diff-filter=A --name-only ${baseBranch} HEAD -- 'shows/'`
	);
	return stdout.split('\n').filter((line) => line.startsWith('shows/'));
};

// Main function modified to check for non-.md files in ./shows
const main = async () => {
	const newFiles = await getNewFilesInShows();
	const nonMdFiles = newFiles.filter((file) => !file.endsWith('.md'));

	if (nonMdFiles.length > 0) {
		console.error('Error: Non-markdown files found in ./shows:', nonMdFiles);
		process.exit(1); // Fail if there are non-markdown files
	}

	// Filter out .md files for further processing
	const mdFiles = newFiles.filter((file) => file.endsWith('.md'));

	if (mdFiles.length === 0) {
		console.log('No new markdown files to check in ./shows.');
		return;
	}

	let hasBrokenLinks = false;
	for (const file of mdFiles) {
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
