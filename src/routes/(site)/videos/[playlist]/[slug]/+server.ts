import { error, redirect } from '@sveltejs/kit';
import { find_video_destination } from '$server/video/old_video_urls';

// The old site's /videos/[playlist]/[video] URLs, some of which still rank on Google
export const GET = async function old_video_url({ params }) {
	const destination = await find_video_destination(params.slug);
	if (!destination) error(404, 'This video does not exist.');
	redirect(301, destination);
};
