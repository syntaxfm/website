import type { Prisma } from '@prisma/client';

type TranscriptWithUtterances = Prisma.TranscriptGetPayload<{
	select: { utterances: true };
}>;

export function transcript_to_string(transcript: TranscriptWithUtterances): string {
	return transcript.utterances
		.map((utterance) => {
			return `${utterance.start}-${utterance.end} ${utterance.speaker}: ${utterance.transcript_value}`;
		})
		.join('\n');
}
