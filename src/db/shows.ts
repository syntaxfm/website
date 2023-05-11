import { type Show } from '@prisma/client';
import matter from 'gray-matter';
import { prisma_client as prisma } from '../hooks.server';
import fs from 'fs/promises';

import path from 'path';

interface FrontMatterGuest {
	name: string;
	twitter: string;
	url: string;
	social: string[];
}

const shows_folder_path = path.join(process.cwd(), 'shows');

export async function get_shows_from_folder() {
	try {
		const files = await fs.readdir(shows_folder_path);

		// Filter only .md files
		const md_files = files.filter((file) => file.endsWith('.md'));

		// Read and process each .md file
		for (const md_file of md_files) {
			const file_path = path.join(shows_folder_path, md_file);
			const file_content = await fs.readFile(file_path, 'utf-8');
			await parse_and_save_show_notes(file_content);
		}
	} catch (err) {
		console.error('Error:', err);
	}
}
// Takes a string of a .md show notes and adds it to the database and adds the guests
export async function parse_and_save_show_notes(notes: string) {
	// Parse the front matter
	const { data, content } = matter(notes);

	// Save the show
	try {
		const show = await prisma.show.create({
			data: {
				number: data.number,
				title: data.title,
				date: new Date(data.date),
				url: data.url,
				show_notes: content
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
		console.log(`Episode # ${show.number} imported successfully}`);
	} catch (err) {
		console.error('Error Importing Show:', err, data, content);
	}
}

async function add_or_update_guest(guest: FrontMatterGuest, show_id: string) {
	try {
		// Extract socials and remove it from the guest object
		const { social, ...guest_without_socials } = guest;

		// Add or update the guest
		const guest_record = await prisma.guest.upsert({
			where: { twitter: guest_without_socials.twitter },
			update: { ...guest_without_socials, show: { connect: { id: show_id } } },
			create: {
				...guest_without_socials,
				show: { connect: { id: show_id } }
			}
		});

		// Handle the socials
		for (const social_link of social) {
			await prisma.socialLink.create({
				data: { link: social_link, guest: { connect: { id: guest_record.id } } }
			});
		}

		return guest_record;
	} catch (err) {
		console.error('Error Importing Guests:', show_id, guest, err);
	}
}
