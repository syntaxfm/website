import fs from 'fs/promises';

export async function get_md_from_folder(folder_path: string) {
	const files = await fs.readdir(folder_path);
	// Filter only .md files
	return files.filter((file) => file.endsWith('.md'));
}
