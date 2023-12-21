import { prisma_client } from '$/hooks.server';
import { encode } from 'gpt-3-encoder';
import { openai } from './openai';
import { KMEANS } from 'density-clustering';
import { average_arrays } from '$/utilities/average_arrays';

async function fetch_embeddings(offset = 0) {
	const take = 20;
	const skip = take * offset;
	console.log({ take, skip });
	// 2. Fetch utterances with no embedding
	const utterances = await prisma_client.transcriptUtterance.findMany({
		where: {
			embedding_set: false
		},
		select: {
			id: true,
			transcript_value: true
		},
		take,
		skip
	});
	console.log(`Found ${utterances.length} utterances with no embedding`);
	// Fetch embedding from OpenAI
	const embedding_response = await openai.embeddings.create({
		model: 'text-embedding-ada-002',
		input: utterances.map((utterance) => utterance.transcript_value)
	});
	console.log(`Fetched ${embedding_response.data.length} embeddings.`);
	// console.log(embedding_response);
	// Save embedding to db

	const update_utterances_query = embedding_response.data.map(({ embedding }, index) => {
		return prisma_client.transcriptUtterance.update({
			where: {
				id: utterances[index].id
			},
			select: {
				id: true
			},
			data: {
				embedding: JSON.stringify(embedding),
				embedding_set: true
			}
		});
	});
	console.log(`Saving ${update_utterances_query.length} utterances with embeddings`);
	const update = await prisma_client.$transaction(update_utterances_query);
	// const update = await Promise.all(update_utterances_query);
	console.log(`Updated ${update.length} utterances with embeddings`);
}

export async function embed_entire_episode(show_number: number) {
	// 1. Find a transcript with no embedding_set on it's transcript
	// const transcript_without_embedding = await prisma_client.transcript.findFirst({
	// 	where: {
	// 		embedding_set: false
	// 	},
	// 	orderBy: {
	// 		show_number: 'desc'
	// 	},
	// 	select: {
	// 		show_number: true
	// 	}
	// });
	// if (!transcript_without_embedding) {
	// 	return {
	// 		message: 'No transcripts without embeddings found'
	// 	};
	// }
	// const show_number = transcript_without_embedding.show_number;
	console.log(`Embedding show ${show_number}`);
	// This function will split the transcript up into 2-3 equal parts, and then embed each part. Then it will average the embeddings together to get the final embedding for the entire episode.
	// 1. Get the transcript for the episode
	const transcript_with_utterances = await prisma_client.transcript.findUnique({
		where: {
			show_number
		},
		select: {
			utterances: {
				select: {
					transcript_value: true
				},
				orderBy: {
					start: 'asc'
				}
			}
		}
	});
	const entire_transcript =
		transcript_with_utterances?.utterances
			.map((utterance) => utterance.transcript_value)
			.join('') || '';

	const tokens = encode(entire_transcript);
	const EMBEDDING_TOKEN_LIMIT = 8000;
	const groups = Math.ceil(tokens.length / EMBEDDING_TOKEN_LIMIT);
	const group_size = entire_transcript.length / groups;
	console.log(
		`Splitting transcript of ${entire_transcript.length} chars (${tokens.length} tokens) into ${groups} groups of ${group_size} characters each`
	);
	const grouped_text = Array(groups)
		.fill(0)
		.map((_, index) => {
			const start = index * group_size;
			const end = start + group_size;
			return entire_transcript.slice(start, end);
		});
	// 2. Embed each group
	const results = await Promise.all(
		grouped_text.map((text) =>
			openai.embeddings.create({
				model: 'text-embedding-ada-002',
				input: text
			})
		)
	);
	// 3. Average the embeddings together
	const embeddings = results.map((result) => result.data.at(0)?.embedding);
	const average_embedding = average_arrays(embeddings);
	// Save the embedding to the db
	const result = await prisma_client.transcript.update({
		where: {
			show_number
		},
		data: {
			embedding: JSON.stringify(average_embedding),
			embedding_set: true
		}
	});
	console.log(`Saved embedding for show ${show_number}`);
	return {
		message: `Embedded show ${show_number}`
	};
}

async function cluster_utterance_embeddings(offset = 0) {
	// 1. Get a list of 500 embeddings
	const utterancesRaw = await prisma_client.transcriptUtterance.findMany({
		where: {
			embedding_set: true
		},
		select: {
			embedding: true,
			transcript_value: true
		},
		take: 2500
	});
	const utterances = utterancesRaw.flatMap((utterance) =>
		// Filter out utterances that are too short or have no embedding
		utterance.embedding && utterance.transcript_value.length >= 30
			? [
					{
						...utterance,
						embedding: JSON.parse(utterance.embedding) as number[]
					}
			  ]
			: []
	);

	// Create an array of embeddings
	const embeddings = utterances.map((utterance) => utterance.embedding);
	const kmeans = new KMEANS();
	const clusters = kmeans.run(embeddings, 30);
	console.log(clusters);
	// Loop over each cluster and log the top 5 utterances
	for (const cluster of clusters) {
		console.log(`Cluster ${cluster}`);
		const cluster_utterances = cluster.map((index) => utterances[index]);
		cluster_utterances.sort((a, b) => b.embedding.length - a.embedding.length);
		console.log(cluster_utterances.slice(0, 25).map((utterance) => utterance.transcript_value));
	}
}

async function cluster_show_embeddings() {
	// 1. Query every show embedding from the db
	const transcripts = await prisma_client.transcript.findMany({
		where: {
			embedding_set: true
		},
		select: {
			show_number: true,
			show: {
				select: {
					title: true
				}
			},
			embedding: true
		}
	});
	console.log(`Found ${transcripts.length} transcripts with embeddings`);
	// 2. Create an array of embeddings
	const embeddings = transcripts.map((transcript) => JSON.parse(transcript.embedding) as number[]);
	console.log(`Found ${embeddings.length} embeddings`);
	const kmeans = new KMEANS();
	const clusters = kmeans.run(embeddings, 30);
	// Loop over each cluster and log 5 of the shows
	for (const cluster of clusters) {
		console.log(`Cluster ================`);
		const shows_in_cluster = cluster.map((index) => transcripts[index]);
		for (const show of shows_in_cluster) {
			console.log(`${show.show_number} - ${show.show.title}`);
		}
	}
}

export async function cluster_embeddings_action({ locals }: { locals: App.Locals }) {
	// await cluster_utterance_embeddings();
	await cluster_show_embeddings();
	return {
		message: 'Clustered Embeddings!'
	};
}

export async function fetch_embedding_action({ locals }: { locals: App.Locals }) {
	console.log('Request for fetch_embedding_action received');
	while (false) {
		const promises = Array(50)
			.fill(0)
			.map((_, index) => fetch_embeddings(index));

		await Promise.all(promises);
	}

	console.log('Done fetching fetch_embedding_action');

	return {
		message: 'Fetched Embedding!'
	};
}

export async function embed_entire_episode_action({ locals }: { locals: App.Locals }) {
	console.log('Request for embed_entire_episode_action received');
	const latest = await prisma_client.transcript.findFirst({
		orderBy: {
			show_number: 'desc'
		},
		where: {
			embedding_set: false
		}
	});

	// const promises = Array(50)
	// 	.fill(0)
	// 	.map((_, index) => embed_entire_episode(latest.show_number - index));

	// await Promise.all(promises);
	if (!latest) {
		return {
			message: 'No transcripts without embeddings found'
		};
	}
	console.log({ latest });

	await embed_entire_episode(latest?.show_number);
	return {
		message: 'Embedded Entire Episode!'
	};
}
