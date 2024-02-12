import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';
import path from 'path';
const execAsync = promisify(exec);

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
// Function to get all new files added in the PR within ./shows directory
const getNewFilesInShows = async () => {
	const baseBranch = process.env.GITHUB_BASE_REF; // Use the base branch of the PR
	const { stdout } = await execAsync(
		`git diff --diff-filter=A --name-only ${baseBranch} HEAD './shows/'`
	);
	// Split the output by new lines to get an array of file paths
	return stdout.split('\n').filter((line) => line.startsWith('shows/'));
};

// Function to check for non-.md files and process .md files
const checkAndProcessNewFiles = async () => {
	const newFiles = await getNewFilesInShows();
	if (newFiles.length === 0) {
		console.log('No new files in ./shows.');
		return;
	}

	// Filter non-markdown files
	const nonMarkdownFiles = newFiles.filter((file) => !file.endsWith('.md'));
	if (nonMarkdownFiles.length > 0) {
		console.error('Non-markdown files found in ./shows:', nonMarkdownFiles);
		process.exit(1); // Fail if there are non-markdown files
	}

	// Proceed with markdown files
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

await checkAndProcessNewFiles();
