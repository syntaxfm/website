export async function import_all_md_files_from_glob() {
	const context = import.meta.glob('/shows/**/*.md', { as: 'raw', eager: true });
	return context;
}
