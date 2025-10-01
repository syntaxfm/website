import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';
// import path from 'path';
const execAsync = promisify(exec);

const URL_CHECK_TIMEOUT = 2 * 1000; // 2 second timeout for url validations
// Function to check URL availability, modified to accept an optional skipUrls array
// Simplified Function to check URL availability
async function isUrlValid(url, method = 'HEAD') {
	try {
		const abortController = new AbortController();
		let complete = false;
		setTimeout(() => {
			if (!complete) {
				abortController.abort();
			}
		}, URL_CHECK_TIMEOUT);
		const response = await fetch(url, {
			method,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
			},
			signal: abortController.signal
		});
		complete = true;
		return response.status !== 404;
	} catch (error) {
		if (error.name === 'AbortError' && method === 'HEAD') {
			// HEAD request timed out after URL_CHECK_TIMEOUT ms
			// try again with GET method instead
			return isUrlValid(url, 'GET');
		}
		console.error(`Error checking URL: ${url}`, error);
		return false; // Treat any error as an invalid URL
	}
}

// Function to parse front-matter and get the episode date
const getEpisodeDate = (content) => {
	const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!frontMatterMatch) return null;

	const frontMatter = frontMatterMatch[1];
	const dateMatch = frontMatter.match(/date:\s*(\d+)/);
	if (!dateMatch) return null;

	return parseInt(dateMatch[1], 10);
};

// Function to check if episode is published
const isEpisodePublished = (content) => {
	const episodeDate = getEpisodeDate(content);
	if (!episodeDate) return true; // If we can't find a date, assume it's published to be safe

	const now = Date.now();
	return episodeDate <= now;
};

// Function to extract URLs from markdown content
const extractUrls = (content) => {
	const urlRegex = /https?:\/\/[^\s\)]+/g;
	return content.match(urlRegex) || [];
};

const validateTimestamps = (content) => {
	// only check timestamps in show notes
	content = content.split('### Show Notes')[1] || content;
	// Regex to match timestamps with [ or = prefix, in formats HH:MM, HH:MM:SS, or HHMM
	const timestampRegex = /(?:\[|=)(?:\d{2}:\d{2}(?::\d{2})?|\d{4})\b/g;
	// Remove prefix from matched timestamps
	const potentialTimestamps = (content.match(timestampRegex) || []).map((t) => t.slice(1));
	const invalidTimestamps = potentialTimestamps.filter((timestamp) => {
		if (!timestamp.includes(':')) {
			// Catching cases like '0702' which should be invalid
			return true;
		}
		const parts = timestamp.split(':').map(Number);
		if (parts.some(isNaN)) {
			// Catching cases with invalid numbers, e.g., '01:-12'
			return true;
		}
		if (parts.length === 3 && (parts[0] > 23 || parts[1] > 59 || parts[2] > 59)) {
			// Checking HH:MM:SS format
			return true;
		}
		if (parts.length === 2 && (parts[0] > 59 || parts[1] > 59)) {
			// Checking MM:SS format
			return true;
		}
		// Assuming a correct format if none of the above conditions are met
		return false;
	});
	return invalidTimestamps;
};

// Function to process a single markdown file for broken links
const processFile = async (filePath) => {
	const content = await fs.readFile(filePath, 'utf8');
	const urls = extractUrls(content);
	const published = isEpisodePublished(content);

	// Filter URLs to check - skip traffic.megaphone.fm for unpublished episodes
	const urlsToCheck = urls.filter((url) => {
		if (!published && url.includes('traffic.megaphone.fm')) {
			console.log(`Skipping validation for unpublished episode URL: ${url}`);
			return false;
		}
		return true;
	});

	const checkPromises = urlsToCheck.map(isUrlValid);
	const results = await Promise.all(checkPromises);
	const brokenLinks = urlsToCheck.filter((_, index) => !results[index]);

	const invalidTimestamps = validateTimestamps(content);

	return {
		brokenLinks,
		invalidTimestamps
	};
};

// Function to get new files added in the PR within ./shows directory
const getNewFilesInShows = async () => {
	const baseBranch = process.env.GITHUB_BASE_REF; // Use the base branch of the PR
	const { stdout } = await execAsync(
		`git diff --diff-filter=A --name-only ${baseBranch} HEAD -- 'shows/'`
	);
	return stdout.split('\n').filter((line) => line.startsWith('shows/'));
};

// Main function modified to check for non-.md files in ./shows
// Main function modified to accumulate and display detailed error messages
const main = async () => {
	const newFiles = await getNewFilesInShows();
	const nonMdFiles = newFiles.filter((file) => !file.endsWith('.md'));

	let errorMessages = []; // Accumulate error messages here

	if (nonMdFiles.length > 0) {
		errorMessages.push(`Error: Non-markdown files found in ./shows: ${nonMdFiles.join(', ')}`);
	}

	const mdFiles = newFiles.filter((file) => file.endsWith('.md'));

	if (mdFiles.length === 0) {
		console.log('No new markdown files to check in ./shows.');
	} else {
		for (const file of mdFiles) {
			const { brokenLinks, invalidTimestamps } = await processFile(file);
			if (brokenLinks.length > 0 || invalidTimestamps.length > 0) {
				errorMessages.push(`Issues found in ${file}:`);
				brokenLinks.forEach((link) => errorMessages.push(`- Broken link: ${link}`));
				invalidTimestamps.forEach((timestamp) =>
					errorMessages.push(`- Invalid timestamp: ${timestamp}`)
				);
			}
		}
	}

	if (errorMessages.length > 0) {
		// Print all accumulated error messages
		console.error('Validation Errors:\n' + errorMessages.join('\n'));
		process.exitCode = 1; // Set the exit code to indicate failure, but allow the process to exit naturally
	}
};

await main();
