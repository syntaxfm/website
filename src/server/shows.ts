import { DAYS_OF_WEEK_TYPES } from '$const';
import { get_hash_from_content } from '$utilities/file_utilities/get_hash_from_content';
import { import_all_md_files_from_glob } from '$utilities/file_utilities/get_md_from_folder';
import { left_pad } from '$utilities/left_pad';
import { error } from '@sveltejs/kit';
import matter from 'gray-matter';
import slug from 'speakingurl';
import { prisma_client as prisma } from '../hooks.server';

interface FrontMatterGuest {
	name: string;
	twitter: string;
	url: string;
	youtube_url?: string;
	social: string[];
}

export async function import_or_update_all_shows() {
	try {
		// Filter only .md files
		const md_files = await import_all_md_files_from_glob();

		// Read and process each .md file
		for (const md_file_path in md_files) {
			const { number, hash, md_file_contents } = await get_show_data_from_glob(
				md_files[md_file_path],
				md_file_path
			);
			await parse_and_save_show_notes(md_file_contents, hash, number, md_file_path);
		}
	} catch (err) {
		console.error('❌ Pod Sync Error:', err);
		error(500, 'Error Importing Shows');
	}
	console.log('🤖 Pod Sync Complete ✅');
	return { message: 'Import All Shows' };
}

export async function import_or_update_all_changed_shows() {
	try {
		// Filter only .md files
		const md_files = await import_all_md_files_from_glob();

		// Read and process each .md file
		for (const md_file_path in md_files) {
			const { number, hash, md_file_contents } = await get_show_data_from_glob(
				md_files[md_file_path],
				md_file_path
			);

			const existing_show = await prisma.show.findUnique({
				where: { number: number }
			});

			// If show doesn't exist or the hash has changed. Refresh
			if (!existing_show || existing_show.hash !== hash) {
        console.log(`Refreshing Show # ${number}`);
				await parse_and_save_show_notes(md_file_contents, hash, number, md_file_path);
			}
		}
	} catch (err) {
		console.error('❌ Pod Sync Error:', err);
		error(500, 'Error Importing Shows');
	}
	console.log('🤖 Pod Sync Complete ✅');
	return { message: 'Import All Shows' };
}

async function get_show_data_from_glob(md_file_contents: string, md_file_path: string) {
	const hash = await get_hash_from_content(md_file_contents);
	const cleaned_path = md_file_path.replace('/shows/', '');
	const number = parseInt(cleaned_path.split(' - ')[0]);
	return { number, hash, md_file_contents };
}

// Takes a string of a .md show notes and adds it to the database and adds the guests
export async function parse_and_save_show_notes(
	notes: string,
	hash: string,
	number: number,
	md_file: string
) {
	// Parse the front matter
	const { data, content } = matter(notes);

	const date = new Date(data.date); // Parse the date string into a Date object

	const dayOfWeek: number = date.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, ...)
	const id = get_id_from_show_number(number);

	const show_type: 'HASTY' | 'TASTY' | 'SUPPER' | 'SPECIAL' =
		DAYS_OF_WEEK_TYPES[dayOfWeek] || 'SPECIAL';
	// Save or update the show
	try {
		await prisma.show.upsert({
			where: { id },
			update: {
				title: data.title,
				slug: slug(data.title),
				date,
				number,
        url: data.url,
				youtube_url: data.youtube_url,
				show_notes: content,
				hash: hash,
				md_file,
				show_type // Assign the calculated show_type
			},
			create: {
				id,
				slug: slug(data.title),
				number,
				title: data.title,
				date,
				url: data.url,
				youtube_url: data.youtube_url,
				show_notes: content,
				hash: hash,
				md_file,
				show_type // Assign the calculated show_type
			}
		});

		// If data guest
		if (data?.guest && Array.isArray(data?.guest)) {
			// Iterate through guests and save or update them
			const guest_promises = data.guest.map((guest) => add_or_update_guest(guest, id));
			// Save guests
			await Promise.all(guest_promises);
			// Otherwise as long as data.guest exists
		} else if (data?.guest) {
			try {
				await add_or_update_guest(data?.guest, id);
			} catch (err) {
				console.error('Error Importing Show and Guests:', id, data.guest, err);
			}
		}
		console.log(`Episode # ${id} imported successfully`);
	} catch (err) {
		console.error('Error Importing Show:', err, data, content);
		// Throw an error to stop the import process
		throw new Error('Error Importing Shows');
	}
}

async function add_or_update_guest(guest: FrontMatterGuest, show_id: string) {
	try {
		const { social, name, ...guest_without_socials } = guest;
		const name_slug = slug(name);

		const guest_record = await prisma.$transaction(async (prisma) => {
			const existingGuest = await prisma.guest.findUnique({ where: { name_slug } });
			if (existingGuest) {
				return await prisma.guest.update({
					where: { name_slug },
					data: { ...guest_without_socials, name, name_slug }
				});
			} else {
				return await prisma.guest.create({
					data: {
						...guest_without_socials,
						name_slug,
						name
					}
				});
			}
		});

		// now do the same for showGuest
		await prisma.$transaction(async (prisma) => {
			const existingShowGuest = await prisma.showGuest.findUnique({
				where: { showId_guestId: { showId: show_id, guestId: guest_record.id } }
			});

			if (existingShowGuest) {
				return; // if the show guest already exists, we do nothing
			} else {
				await prisma.showGuest.create({
					data: { showId: show_id, guestId: guest_record.id }
				});
			}
		});

		if (social) {
			let socialLinks = [];
			// If social is a string, convert it to an array with one element
			if (typeof social === 'string') {
				socialLinks = [social];
			} else if (Array.isArray(social)) {
				socialLinks = social;
			} else {
				console.error('Unexpected data type for social:', typeof social);
				return;
			}
			const socialLink_promises = socialLinks.map((social_link) =>
				prisma.socialLink.upsert({
					where: { link_guest_id: { link: social_link, guest_id: guest_record.id } },
					update: { link: social_link, guest: { connect: { id: guest_record.id } } },
					create: { link: social_link, guest: { connect: { id: guest_record.id } } }
				})
			);
			await Promise.all(socialLink_promises);
		}
		return guest_record;
	} catch (err) {
		console.error('Error Importing Guests:', show_id, guest, err);
	}
}

export function get_id_from_show_number(num: number) {
	return `syntax_podcast_show_${left_pad(num)}`;
}

// TODO Delete Cache for each new show
