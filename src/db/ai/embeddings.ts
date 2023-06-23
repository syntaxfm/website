import { readFile, readdir, writeFile } from 'fs/promises';
import { CONDENSE_THRESHOLD, EMBEDDING_MODEL, openai } from './openai';
import { getXataClient } from './embeddings/src/xata';
import { notExists } from "@xata.io/client";
import colors from 'colors';
import { PrerecordedTranscriptionResponse } from '@deepgram/sdk/dist/types';
import { SlimUtterance, formatAsTranscript, formatForEmbedding, getSlimUtterances } from './deepgram/utils';
import { encode } from 'gpt-3-encoder';
// import { shows } from './server';
import { config } from 'dotenv';
config();
const client = getXataClient();

export async function answerWithContext(question: string) {
  console.log(`Answering question: ${question}`);
  // 1 .Convert the question to something suitable for embedding
  // const suitableQuestion = await makeSuitableForEmbedding(question);
  // 1. Find similar utterances to this question
  const utterances = await findSimilarUtterances(question, 5) as unknown as SlimUtterance[];
  console.log(`Found ${utterances.length} similar utterance`);
  // 2. Stitch together the context
  const context = utterances.filter(utterance => utterance.transcript?.length > 50).map((utterance) => {
    return `In show #${utterance.showNumber} at ${formatTime(utterance.start)}, ${utterance.speaker} said "${utterance.transcript}"`;
  });
  const contextRoles: ChatCompletionRequestMessage[] = context.map(c => ({ role: 'user', content: c }));
  // 3. Pipe that context and the original question into OpenAI
  const input: CreateChatCompletionRequest = {
    model: MODEL,
    // model: 'gpt-3.5-turbo',
    "messages": [
      { "role": "system", "content": "You are a helpful assistant working for Syntax (a podcast about web development). Your tone is smart but casual" },
      { "role": "user", "content": "The following contexts are parts of podcast transcripts related to my question:" },
      ...contextRoles,
      { "role": "user", "content": "provide a concise answer. Do not make things up. If I don't ask a question, summarize the topic. You may use code blocks, bolding, bullet points, and paragraphs if needed. Provide answer in markdown. Reference show numbers at the end of sentences like this: [#420]" },
      { "role": "user", "content": "Try to reference the podcast host's or guest's thoughts and opinions in your answer" },
      { "role": "user", "content": question }
    ]
  }
  console.log(`Creating AI answer for ${question}`);
  console.time(`Creating AI answer for ${question}`);
  const completion = await openai.createChatCompletion(input);
  console.timeEnd(`Creating AI answer for ${question}`);
  return {
    input,
    output: completion.data
  }
}

async function makeSuitableForEmbedding(question: string) {
  const input: CreateChatCompletionRequest = {
    model: MODEL,
    "messages": [
      { "role": "user", "content": `Make this suitable for search embedding: ${question}` }
    ]
  };
  try {
    const completion = await openai.createChatCompletion(input);
    const suitableQuesiton = completion.data.choices.at(0)?.message?.content;
    return suitableQuesiton || question;
  }
  catch (error) {
    return question;
  }
}

async function generateAndSaveEmbedding(utterance: SlimUtterance, showNumber: number) {
  console.log(`Generating for show ${showNumber}`);
  if (!utterance?.transcript) return;
  const response = await openai.createEmbedding({
    input: utterance?.transcript,
    model: 'text-embedding-ada-002'
  });
  if (!response?.data?.data?.at(0)) return;
  console.log(response.data.data.at(0).embedding);
  if (!utterance?.transcript) return;
  const res = await client.db.embeddings.create({
    transcript: utterance?.transcript,
    embedding: response.data.data.at(0).embedding,
    showNumber: showNumber,
    speaker: utterance?.speaker,
  });
  return res;
}

// Read all shows from disk
const files = (await readdir('./deepgram/transcripts-flagged')).reverse().filter(file => file.endsWith('.json'));

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateEmbeddingWithIndex(utterance: SlimUtterance, showNumber: number, index: number) {
  console.log(colors.green(`Updating for show ${showNumber}, index ${index}`));
  const existing = await client.db.embeddings.filter({
    showNumber: showNumber,
    transcript: utterance?.transcript
  }).getFirst();
  if (!existing) {
    console.log(`Skipping ${showNumber} ${index} because it doesn't exist`);
  }
  const updates = {
    utteranceIndex: index,
    start: utterance?.start,
    end: utterance?.end,
  };
  const updated = await existing.update(updates);
  console.log(`Updated ${updated.id}`);
  return updated;
}


async function parseTranscriptsIntoEmbeddings() {
  for (const file of files) {
    console.log(`Processing ${file}`);
    const [showNumberString] = file.split('-');
    const showNumber = parseInt(showNumberString.trim());

    // See if we already have an embedding for this show
    const existing = await client.db.embeddings
      .filter("showNumber", showNumber)
      .filter(notExists("utteranceIndex"))
      .getPaginated();

    console.log(`Show ${showNumber} has ${existing.records.length} missing`);
    if (existing.records.length === 0) {
      console.log(`Show ${showNumber} has ${existing.records.length} missing, skipping`);
      continue;
    }

    // if (existing.records.length > 10) {
    //   console.log(`Skipping ${file} because we already have an embedding for show ${showNumber}`);
    //   continue;
    // }

    // await wait(2000);
    // 2. Read in the file
    const transcriptRaw = await readFile(`./deepgram/transcripts-flagged/${file}`, 'utf-8');
    // 3. Parse the file
    const transcriptUtterances = JSON.parse(transcriptRaw) as unknown as PrerecordedTranscriptionResponse;
    if (!transcriptUtterances?.results?.utterances) {
      console.log(`Skipping ${file} because it has no utterances`);
      continue;
    }
    const transcript = getSlimUtterances(transcriptUtterances.results?.utterances, showNumber);
    // 4. For each utterance, generate and save the embedding
    // const promises = transcript.map((utterance, index) => generateAndSaveEmbedding(utterance, showNumber, index));
    const promises = transcript.map((utterance, index) => updateEmbeddingWithIndex(utterance, showNumber, index));
    await Promise.allSettled(promises);
  }
}
export async function findSimilarUtterances(text: string, size = 5) {
  console.log(`Finding similar utterances for ${text}`);
  // 1. Convert input text to embedding
  const response = await openai.createEmbedding({
    input: text,
    model: EMBEDDING_MODEL
  });
  const embedding = response.data.data.at(0)?.embedding;
  if (!embedding) {
    throw new Error(`No embedding found for ${text}`);
  }

  // 2. Find similar utterances
  const similar = await client.db.embeddings.vectorSearch("embedding", embedding, {
    size,
  });

  // 3. for the first Utterance grab the 1 neighboring utterances to expand the context
  const firstUtterance = similar[0];
  const additionalContext = await client.db.embeddings.filter({
    showNumber: firstUtterance.showNumber,
    utteranceIndex: {
      $all: [
        { $gt: firstUtterance.utteranceIndex - 2 },
        { $lt: firstUtterance.utteranceIndex + 2 },
      ]
    }
  })
    .sort("utteranceIndex", "asc")
    .getAll();

  console.log(`We have ${additionalContext.length} additional utterances to add to the ${similar.length} similar utterances}`);

  const similarWithScore = similar.map((s) => ({
    ...s,
    // TODO: Find value for similarity getMetaData
    metadata: s.getMetadata()
  }));

  // 3. Return the utterances
  return [...additionalContext, ...similarWithScore.slice(1)];
}

async function storeEntireEpisodes() {
  // 1. Read all shows from disk
  const files = (await readdir('./deepgram/condensed')).reverse().filter(file => file.endsWith('.json'));
  // 2. For each show, read the file
  for (const file of files) {


    const [showNumberString] = file.split('.');
    const showNumber = parseInt(showNumberString.trim());
    const show = shows.find(s => s.number === showNumber);
    // Skip if we already have an embedding for this show
    const existing = await client.db.shows.filter("showNumber", showNumber).getFirst();
    if (existing) {
      console.log(`Skipping ${file} because we already have an embedding for show ${showNumber}`);
      continue;
    }
    const transcriptRaw = await readFile(`./deepgram/condensed/${file}`, 'utf-8');
    // 3. Parse the file
    const utts = JSON.parse(transcriptRaw) as unknown as SlimUtterance[];
    // 5. Generate Transcript
    const transcript = formatForEmbedding(utts);
    // Convert to embedding with OpenAI
    console.log(`Getting embedding for ${showNumber}`);
    const response = await openai.createEmbedding({
      input: transcript,
      model: EMBEDDING_MODEL,
    });
    const embedding = response.data.data.at(0)?.embedding;
    if (!embedding) {
      throw new Error(`No embedding found for ${transcript}`);
    }
    // 6. Store the embedding
    console.log(`Storing embedding for ${showNumber}`);
    const res = await client.db.shows.create({
      transcript: transcript,
      embedding: embedding,
      showNumber: showNumber,
      title: show?.title,
    });
  }
}

/**
 * @description Sometimes the OpenAI API returns an error when condensing a transcript. This function will find utterances with missing condensed text and try again
 */
async function healTranscriptWithMissingCondensed(transcript: SlimUtterance[]) {
  // 1. Loop over each uterance and see if it has a condensed version
  for (const [i, utterance] of transcript.entries()) {
    if (utterance.utteranceIndex !== i) {
      console.log(`misindexed utterance ${utterance.showNumber}-${utterance.utteranceIndex} at index ${i}`);
    }
    if (!(utterance.utteranceIndex >= 0)) {
      console.log(`Missing utterance index for ${utterance.showNumber}-${utterance.utteranceIndex}`);
      // console.log(utterance);
    }
    if (!utterance.condensedTranscript && utterance.transcript.length > CONDENSE_THRESHOLD) {
      console.log(`Missing condensed transcript for ${utterance.showNumber}-${utterance.utteranceIndex}`);
    }
    // if(utterance.condensedTranscript?.length === utterance.transcript.length) {
    //   console.log(`Utterance ${utterance.showNumber}-${utterance.utteranceIndex} is the same as its uncondensed version`);
    // }
  }
}
