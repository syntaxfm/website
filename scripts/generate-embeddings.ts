#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { batchProcessEmbeddings } from '../src/server/ai/embeddings.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
	try {
		console.log('🤖 Starting embedding generation for all episodes...');
		
		// Get all episodes that don't have embeddings yet
		const shows = await prisma.show.findMany({
			where: {
				embedding: null,
				date: {
					lte: new Date() // Only published episodes
				}
			},
			select: {
				number: true
			},
			orderBy: {
				number: 'desc' // Start with newest episodes
			}
		});

		if (shows.length === 0) {
			console.log('✅ All episodes already have embeddings!');
			return;
		}

		console.log(`📊 Found ${shows.length} episodes without embeddings`);
		
		const showNumbers = shows.map((show) => show.number);
		
		// Process in batches to avoid overwhelming the API
		const batchSize = 10;
		for (let i = 0; i < showNumbers.length; i += batchSize) {
			const batch = showNumbers.slice(i, i + batchSize);
			console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(showNumbers.length / batchSize)}`);
			console.log(`Episodes: ${batch.join(', ')}`);
			
			await batchProcessEmbeddings(batch);
			
			// Longer delay between batches to respect rate limits
			if (i + batchSize < showNumbers.length) {
				console.log('⏳ Waiting 30 seconds before next batch...');
				await new Promise<void>((resolve) => setTimeout(resolve, 30000));
			}
		}
		
		console.log('\n✅ Embedding generation complete!');
		
	} catch (error) {
		console.error('❌ Error generating embeddings:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}