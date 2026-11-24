import { resolve } from '$app/paths';

// Views that share one page header: the Podcast list and its transcripts
export const PODCAST_TABS = [
	{ href: resolve('admin/content/podcast'), label: 'Episodes' },
	{ href: resolve('admin/content/podcast/transcripts'), label: 'Transcripts' }
];
