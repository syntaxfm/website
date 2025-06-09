import { createHash } from 'crypto';
import { prisma_client } from '../prisma-client.js';
import { get_show_detail_query, type ShowDetail } from '../shows/shows_queries.js';
import { openai } from './openai.js';

export interface EmbeddingData {
	content: string;
	hash: string;
	embedding: number[];
}

/**
 * Generate content string from episode for embedding
 */
export function prepareEpisodeContent(show: ShowDetail): string {
	const parts = [
		show.title,
		show.show_notes,
		// Include AI-generated summary if available
		show.aiShowNote?.description,
		// Include topics
		show.aiShowNote?.topics?.map((t: any) => t.name).join(', '),
		// Include guest information
		show.guests?.map((g: any) => `${g.Guest.name} ${g.Guest.of || ''}`).join(', ')
	].filter(Boolean);

	return parts.join('\n\n');
}

/**
 * Generate embedding for episode content using OpenAI v3 API
 */
export async function generateEpisodeEmbedding(content: string) {
	try {
		const response = await openai.createEmbedding({
			model: 'text-embedding-ada-002',
			input: content
		});

		return response.data.data[0].embedding;
	} catch (error) {
		console.error('Error generating embedding:', error);
		throw new Error('Failed to generate embedding');
	}
}

/**
 * Create content hash for caching
 */
export function createContentHash(content: string): string {
	return createHash('sha256').update(content).digest('hex');
}

/**
 * Process and store embedding for a show
 */
export async function processShowEmbedding(showNumber: number) {
	try {
		// Get full show details
		const show = await prisma_client.show.findUnique(get_show_detail_query(showNumber));
		
		if (!show) {
			throw new Error(`Show ${showNumber} not found`);
		}

		// Prepare content for embedding
		const content = prepareEpisodeContent(show);
		const contentHash = createContentHash(content);

		// Check if embedding already exists with same content hash
		const existingEmbedding = await prisma_client.episodeEmbedding.findUnique({
			where: { show_number: showNumber }
		});

		if (existingEmbedding && existingEmbedding.content_hash === contentHash) {
			console.log(`Embedding for show ${showNumber} is up to date`);
			return;
		}

		// Generate new embedding
		console.log(`Generating embedding for show ${showNumber}: ${show.title}`);
		const embedding = await generateEpisodeEmbedding(content);

		// Store or update embedding
		await prisma_client.episodeEmbedding.upsert({
			where: { show_number: showNumber },
			update: {
				embedding: embedding,
				content_hash: contentHash,
				model: 'text-embedding-ada-002',
				updated_at: new Date()
			},
			create: {
				show_number: showNumber,
				embedding: embedding,
				content_hash: contentHash,
				model: 'text-embedding-ada-002'
			}
		});

		console.log(`Successfully processed embedding for show ${showNumber}`);
	} catch (error) {
		console.error(`Error processing embedding for show ${showNumber}:`, error);
		throw error;
	}
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
	if (vectorA.length !== vectorB.length) {
		throw new Error('Vectors must have the same length');
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < vectorA.length; i++) {
		dotProduct += vectorA[i] * vectorB[i];
		normA += vectorA[i] * vectorA[i];
		normB += vectorB[i] * vectorB[i];
	}

	normA = Math.sqrt(normA);
	normB = Math.sqrt(normB);

	if (normA === 0 || normB === 0) {
		return 0;
	}

	return dotProduct / (normA * normB);
}

/**
 * Find related episodes based on embedding similarity
 */
export async function findRelatedEpisodes(
	showNumber: number, 
	limit: number = 5,
	threshold: number = 0.7
) {
	try {
		// Get the target show's embedding
		const targetEmbedding = await prisma_client.episodeEmbedding.findUnique({
			where: { show_number: showNumber }
		});

		if (!targetEmbedding) {
			throw new Error(`No embedding found for show ${showNumber}`);
		}

		// Get all other embeddings
		const allEmbeddings = await prisma_client.episodeEmbedding.findMany({
			where: {
				show_number: { not: showNumber }
			},
			include: {
				show: {
					include: {
						guests: {
							include: {
								Guest: true
							}
						},
						aiShowNote: {
							include: {
								topics: true,
								summary: true
							}
						},
						hosts: true
					}
				}
			}
		});

		// Calculate similarities
		const similarities = allEmbeddings
			.map((embedding: any) => {
				const similarity = cosineSimilarity(
					targetEmbedding.embedding as number[],
					embedding.embedding as number[]
				);
				
				return {
					show: embedding.show,
					similarity
				};
			})
			.filter((item: any) => item.similarity >= threshold)
			.sort((a: any, b: any) => b.similarity - a.similarity)
			.slice(0, limit);

		return similarities;
	} catch (error) {
		console.error(`Error finding related episodes for show ${showNumber}:`, error);
		throw error;
	}
}

/**
 * Batch process embeddings for multiple shows
 */
export async function batchProcessEmbeddings(showNumbers: number[]) {
	console.log(`Processing embeddings for ${showNumbers.length} shows`);
	
	for (const showNumber of showNumbers) {
		try {
			await processShowEmbedding(showNumber);
			// Add a small delay to avoid hitting rate limits
			await new Promise((resolve: any) => setTimeout(resolve, 100));
		} catch (error) {
			console.error(`Failed to process embedding for show ${showNumber}:`, error);
			// Continue with other shows
		}
	}
	
	console.log('Batch processing complete');
}

/**
 * Get or generate embedding for a show
 */
export async function getOrCreateEmbedding(showNumber: number) {
	const existing = await prisma_client.episodeEmbedding.findUnique({
		where: { show_number: showNumber }
	});

	if (existing) {
		return existing.embedding as number[];
	}

	// Generate new embedding
	await processShowEmbedding(showNumber);
	
	const newEmbedding = await prisma_client.episodeEmbedding.findUnique({
		where: { show_number: showNumber }
	});

	if (!newEmbedding) {
		throw new Error(`Failed to create embedding for show ${showNumber}`);
	}

	return newEmbedding.embedding as number[];
}