import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';
// import path from 'path';
const exec_async = promisify(exec);

const URL_CHECK_TIMEOUT = 2 * 1000; // 2 second timeout for url validations
// Function to check URL availability, modified to accept an optional skipUrls array
// Simplified Function to check URL availability
async function isUrlValid(url, method = 'HEAD') {
	try {
		const abort_controller = new AbortController();
		let complete = false;
		setTimeout(() => {
			if (!complete) {
				abort_controller.abort();
			}
		}, URL_CHECK_TIMEOUT);
		const response = await fetch(url, {
			method,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
			},
			signal: abort_controller.signal
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
const get_episode_date = (content) => {
	const front_matter_match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!front_matter_match) return null;

	const front_matter = front_matter_match[1];
	const date_match = front_matter.match(/date:\s*(\d+)/);
	if (!date_match) return null;

	return parseInt(date_match[1], 10);
};

// Function to check if episode is published
const is_episode_published = (content) => {
	const episode_date = get_episode_date(content);
	if (!episode_date) return true; // If we can't find a date, assume it's published to be safe

	const now = Date.now();
	return episode_date <= now;
};

// Function to extract URLs from markdown content
const extract_urls = (content) => {
	const url_regex = /https?:\/\/[^\s)]+/g;
	return content.match(url_regex) || [];
};

const validate_timestamps = (content) => {
	// only check timestamps in show notes
	content = content.split('### Show Notes')[1] || content;
	// Regex to match timestamps with [ or = prefix, in formats HH:MM, HH:MM:SS, or HHMM
	const timestamp_regex = /(?:\[|=)(?:\d{2}:\d{2}(?::\d{2})?|\d{4})\b/g;
	// Remove prefix from matched timestamps
	const potential_timestamps = (content.match(timestamp_regex) || []).map((t) => t.slice(1));
	const invalid_timestamps = potential_timestamps.filter((timestamp) => {
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
	return invalid_timestamps;
};

// Function to process a single markdown file for broken links
const process_file = async (filePath) => {
	const content = await fs.readFile(filePath, 'utf8');
	const urls = extract_urls(content);
	const published = is_episode_published(content);

	// Filter URLs to check - skip traffic.megaphone.fm for unpublished episodes
	const urls_to_check = urls.filter((url) => {
		if (!published && url.includes('traffic.megaphone.fm')) {
			console.log(`Skipping validation for unpublished episode URL: ${url}`);
			return false;
		}
		return true;
	});

	const check_promises = urls_to_check.map(isUrlValid);
	const results = await Promise.all(check_promises);
	const broken_links = urls_to_check.filter((_, index) => !results[index]);

	const invalid_timestamps = validate_timestamps(content);

	return {
		brokenLinks: broken_links,
		invalidTimestamps: invalid_timestamps
	};
};

// Function to get new files added in the PR within ./shows directory
const get_new_files_in_shows = async () => {
	const base_branch = process.env.GITHUB_BASE_REF; // Use the base branch of the PR
	const { stdout } = await exec_async(
		`git diff --diff-filter=A --name-only ${base_branch} HEAD -- 'shows/'`
	);
	return stdout.split('\n').filter((line) => line.startsWith('shows/'));
};

// Main function modified to check for non-.md files in ./shows
// Main function modified to accumulate and display detailed error messages
const main = async () => {
	const new_files = await get_new_files_in_shows();
	const non_md_files = new_files.filter((file) => !file.endsWith('.md'));

	let error_messages = []; // Accumulate error messages here

	if (non_md_files.length > 0) {
		error_messages.push(`Error: Non-markdown files found in ./shows: ${non_md_files.join(', ')}`);
	}

	const md_files = new_files.filter((file) => file.endsWith('.md'));

	if (md_files.length === 0) {
		console.log('No new markdown files to check in ./shows.');
	} else {
		for (const file of md_files) {
			const { brokenLinks: broken_links, invalidTimestamps: invalid_timestamps } =
				await process_file(file);
			if (broken_links.length > 0 || invalid_timestamps.length > 0) {
				error_messages.push(`Issues found in ${file}:`);
				broken_links.forEach((link) => error_messages.push(`- Broken link: ${link}`));
				invalid_timestamps.forEach((timestamp) =>
					error_messages.push(`- Invalid timestamp: ${timestamp}`)
				);
			}
		}
	}

	if (error_messages.length > 0) {
		// Print all accumulated error messages
		console.error('Validation Errors:\n' + error_messages.join('\n'));
		process.exitCode = 1; // Set the exit code to indicate failure, but allow the process to exit naturally
	}
};

await main();
