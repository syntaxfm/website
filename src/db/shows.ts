import slugo from 'slugo';
import matter from 'gray-matter';
import { prisma_client as prisma } from '../hooks.server';
import fs from 'fs/promises';
import path from 'path';
import { get_md_from_folder } from '$utilities/file_utilities/get_md_from_folder';
import { get_hash_from_content } from '$utilities/file_utilities/get_hash_from_content';
import { error } from '@sveltejs/kit';

interface FrontMatterGuest {
	name: string;
	twitter: string;
	url: string;
	social: string[];
}

const shows_folder_path = path.join(process.cwd(), 'shows');

export async function import_or_update_all_shows() {
	try {
		// Filter only .md files
		const md_files = await get_md_from_folder(shows_folder_path);

		// Read and process each .md file
		for (const md_file of md_files) {
			const file_path = path.join(shows_folder_path, md_file);
			const file_content = await fs.readFile(file_path, 'utf-8');
			const hash = await get_hash_from_content(file_content);

			const number = parseInt(md_file.split(' - ')[0]);

			const existing_show = await prisma.show.findFirst({
				where: { number: number }
			});

			if (!existing_show) {
				// If the show doesn't exist, create it.
				await parse_and_save_show_notes(file_content, hash, number, md_file);
			} else if (existing_show.hash !== hash) {
				// If the show exists and the hash has changed, update it.
				await parse_and_save_show_notes(file_content, hash, number, md_file);
			}
		}
	} catch (err) {
		console.error('❌ Pod Sync Error:', err);
		throw error(500, 'Error Importing Shows');
	}
	console.log('🤖 Pod Sync Complete ✅');
	return { message: 'Import All Shows' };
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

	// Save or update the show
	try {
		const show = await prisma.show.upsert({
			where: { number: number },
			update: {
				title: data.title,
				slug: slugo(data.title),
				date: new Date(data.date),
				url: data.url,
				show_notes: content,
				hash: hash,
				md_file
			},
			create: {
				slug: slugo(data.title),
				number: data.number,
				title: data.title,
				date: new Date(data.date),
				url: data.url,
				show_notes: content,
				hash: hash,
				md_file
			}
		});

		// If data guest
		if (data?.guest && Array.isArray(data?.guest)) {
			// Iterate through guests and save or update them
			const guest_promises = data.guest.map((guest) => add_or_update_guest(guest, show.id));
			// Save guests
			await Promise.all(guest_promises);
			// Otherwise as long as data.guest exists
		} else if (data?.guest) {
			try {
				await add_or_update_guest(data?.guest, show.id);
			} catch (err) {
				console.error('Error Importing Show and Guests:', show.number, data.guest, err);
			}
		}
		console.log(`Episode # ${show.number} imported successfully`);
	} catch (err) {
		console.error('Error Importing Show:', err, data, content);
		// Throw an error to stop the import process
		throw new Error('Error Importing Shows');
	}
}

async function add_or_update_guest(guest: FrontMatterGuest, show_id: string) {
	try {
		const { social, name, ...guest_without_socials } = guest;
		const name_slug = slugo(name);

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
