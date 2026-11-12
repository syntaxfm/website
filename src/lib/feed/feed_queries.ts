// Only what the feed cards render (FeedItemPodcast, FeedByline, ShowThumbnail, FeedItemVideo).
// Selecting whole rows sent show notes, search vectors and AI notes: 494 KB for the Home feed's
// 100 cards, 2.1 MB for the 201 on #javascript.
export const feed_card_query = {
	columns: { id: true, type: true, published_at: true },
	with: {
		show: {
			columns: {
				number: true,
				title: true,
				slug: true,
				url: true,
				youtube_url: true,
				show_type: true,
				date: true
			},
			with: {
				guests: { columns: {}, with: { guest: { columns: { name: true, github: true } } } },
				hosts: {
					columns: {},
					with: { profile: { columns: { name: true, username: true } } }
				}
			}
		},
		tags: { columns: {}, with: { tag: { columns: { name: true, slug: true } } } },
		video: { columns: { title: true } }
	}
} as const;
