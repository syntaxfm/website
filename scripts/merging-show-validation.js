import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';
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
// Modified function to get .md files from ./shows
const getMarkdownFiles = async () => {
	const directoryPath = './shows'; // Target directory
	const files = await fs.readdir(directoryPath);
	return files.filter((file) => file.endsWith('.md')).map((file) => path.join(directoryPath, file));
};

// New function to check for non-.md files in ./shows
const checkForNonMarkdownFiles = async () => {
	const directoryPath = './shows';
	const files = await fs.readdir(directoryPath);
	const nonMarkdownFiles = files.filter((file) => !file.endsWith('.md'));
	if (nonMarkdownFiles.length > 0) {
		console.error('Non-markdown files found in ./shows:', nonMarkdownFiles);
		process.exit(1); // Fail if there are non-markdown files
	}
};

const main = async () => {
	await checkForNonMarkdownFiles(); // Check for non-markdown files first

	const markdownFiles = await getMarkdownFiles();
	if (markdownFiles.length === 0) {
		console.log('No markdown files to check in ./shows.');
		return;
	}
	let hasBrokenLinks = false;
	for (const file of markdownFiles) {
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
