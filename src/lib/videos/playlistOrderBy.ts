import { PlaylistOrder } from '@prisma/client';

export default {
	[PlaylistOrder.YouTubeAsc]: {
		order: 'asc'
	},
	[PlaylistOrder.YouTubeDesc]: {
		order: 'desc'
	},
	[PlaylistOrder.VideoPublishedAtDesc]: {
		video: {
			published_at: 'desc'
		}
	},
	[PlaylistOrder.VideoPublishedAtAsc]: {
		video: {
			published_at: 'asc'
		}
	}
} as const;
