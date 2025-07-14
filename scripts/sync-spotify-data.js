#!/usr/bin/env node

/**
 * Sync Spotify Data Script
 *
 * This script syncs Spotify data for all episodes using the built syncEpisodeSpotifyData function
 * and tracks episodes that could not be matched.
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function syncSpotifyData() {
	console.log('🎵 Starting Spotify data sync for all episodes...\n');

	try {
		// Import the sync function and types
		const { syncEpisodeSpotifyData } = await import('../src/server/megaphone/sync.ts');

		// Create credentials object
		const credentials = {
			apiToken: process.env.MEGAPHONE_API_TOKEN,
			networkId: process.env.MEGAPHONE_NETWORK_ID,
			podcastId: process.env.MEGAPHONE_PODCAST_ID
		};

		// Get all episodes from database that don't have Spotify IDs
		const shows = await prisma.show.findMany({
			where: { spotify_id: null },
			select: { number: true, title: true, spotify_id: true },
			orderBy: { number: 'desc' }
		});

		console.log(`Found ${shows.length} episodes without Spotify IDs\n`);

		if (shows.length === 0) {
			console.log('✅ All episodes already have Spotify IDs!');
			return;
		}

		// Track results
		const results = {
			processed: 0,
			updated: 0,
			unmatched: [],
			errors: []
		};

		console.log('Processing episodes...\n');

		// Process each show
		for (const show of shows) {
			try {
				console.log(`Processing episode ${show.number}: ${show.title}`);
				results.processed++;

				// Use the existing sync function
				await syncEpisodeSpotifyData(show.number, credentials);

				// Check if it was updated
				const updatedShow = await prisma.show.findUnique({
					where: { number: show.number },
					select: { spotify_id: true }
				});

				if (updatedShow?.spotify_id) {
					results.updated++;
					console.log(`  ✅ Updated with Spotify ID: ${updatedShow.spotify_id}`);
				} else {
					results.unmatched.push({
						number: show.number,
						title: show.title
					});
					console.log(`  ❌ No match found or no Spotify ID available`);
				}
			} catch (error) {
				results.errors.push({
					number: show.number,
					title: show.title,
					error: error.message
				});
				console.error(`  ❌ Error processing episode ${show.number}: ${error.message}`);
			}

			// Add a small delay to avoid overwhelming the API
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Final results
		console.log('\n' + '='.repeat(80));
		console.log('📊 SYNC RESULTS:');
		console.log('='.repeat(80));
		console.log(`Total episodes processed: ${results.processed}`);
		console.log(`✅ Successfully updated: ${results.updated}`);
		console.log(`❌ Unmatched episodes: ${results.unmatched.length}`);
		console.log(`🚨 Errors: ${results.errors.length}`);
		console.log(`📈 Success rate: ${((results.updated / results.processed) * 100).toFixed(1)}%`);

		if (results.unmatched.length > 0) {
			console.log('\n❌ UNMATCHED EPISODES:');
			results.unmatched.forEach((episode) => {
				console.log(`  ${episode.number}: ${episode.title}`);
			});
		}

		if (results.errors.length > 0) {
			console.log('\n🚨 ERRORS:');
			results.errors.forEach((error) => {
				console.log(`  ${error.number}: ${error.title} - ${error.error}`);
			});
		}

		if (results.unmatched.length > 0 || results.errors.length > 0) {
			console.log('\n🔧 RECOMMENDATIONS:');
			console.log('- Check if unmatched episodes exist on Spotify');
			console.log('- Review episode titles for formatting differences');
			console.log('- Verify episode numbering consistency');
			console.log('- Check Megaphone API response for completeness');
		}
	} catch (error) {
		console.error('❌ Fatal error:', error.message);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
syncSpotifyData();
