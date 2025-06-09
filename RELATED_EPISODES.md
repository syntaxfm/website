# Related Episodes Feature

This document describes the implementation of the related episodes feature using AI embeddings for semantic similarity search.

## Overview

The related episodes feature uses OpenAI's text embeddings to find semantically similar podcast episodes. Instead of relying on simple keyword matching or tags, this system understands the _meaning_ and content of episodes to suggest truly relevant related content.

## Architecture

### Database Schema

The feature adds a new `EpisodeEmbedding` model to store vector embeddings:

```prisma
model EpisodeEmbedding {
  id          String   @id @default(uuid())
  show        Show     @relation(fields: [show_number], references: [number])
  show_number Int      @unique
  embedding   Json     // Store the embedding vector as JSON
  content_hash String  // Hash of the content used to generate embedding
  model       String   @default("text-embedding-ada-002") // OpenAI model used
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([show_number])
}
```

### Components

1. **Embedding Generation Service** (`src/server/ai/embeddings.ts`)
   - Generates embeddings from episode content using OpenAI API
   - Combines title, show notes, AI summaries, topics, and guest info
   - Calculates cosine similarity between episode vectors
   - Handles caching and content change detection

2. **API Endpoint** (`src/routes/api/shows/[number]/related/+server.ts`)
   - REST API for fetching related episodes
   - Supports configurable similarity threshold and result limit
   - Returns formatted episode data with similarity scores

3. **UI Component** (`src/lib/components/RelatedEpisodes.svelte`)
   - Svelte component for displaying related episodes
   - Shows similarity scores, episode metadata, and topics
   - Responsive design with loading and error states

4. **Generation Script** (`scripts/generate-embeddings.ts`)
   - TypeScript batch processing script for generating embeddings
   - Handles rate limiting and error recovery
   - Can be run via `pnpm embeddings:generate`

## How It Works

### 1. Content Preparation
For each episode, the system combines multiple content sources:
- Episode title and show notes
- AI-generated description and topics (if available) 
- Guest names and affiliations
- Host information

### 2. Embedding Generation
- Content is sent to OpenAI's `text-embedding-ada-002` model
- Returns a 1536-dimensional vector representing the semantic meaning
- Content hash is stored to detect changes and avoid regeneration

### 3. Similarity Calculation
- Uses cosine similarity to compare episode vectors
- Ranges from 0 (completely different) to 1 (identical)
- Default threshold of 0.7 filters for high-quality matches

### 4. Related Episode Retrieval
- Finds episodes above similarity threshold
- Excludes the current episode from results
- Sorts by similarity score and limits results

## API Usage

### Get Related Episodes

```http
GET /api/shows/{show_number}/related?limit=5&threshold=0.7
```

**Parameters:**
- `limit` (optional): Maximum number of results (default: 5)
- `threshold` (optional): Minimum similarity score (default: 0.7)

**Response:**
```json
{
  "show_number": 900,
  "related_episodes": [
    {
      "number": 875,
      "title": "JavaScript Signals Explained", 
      "slug": "javascript-signals-explained",
      "date": "2024-11-15T00:00:00.000Z",
      "show_type": "HASTY",
      "similarity": 0.82,
      "guests": [],
      "topics": ["JavaScript", "Signals", "Reactive Programming"],
      "url": "/show/875/javascript-signals-explained"
    }
  ],
  "total": 1
}
```

## UI Component Usage

```svelte
<script>
  import RelatedEpisodes from '$lib/components/RelatedEpisodes.svelte';
</script>

<RelatedEpisodes 
  show_number={900} 
  limit={5} 
  threshold={0.7} 
/>
```

**Props:**
- `show_number`: The current episode number
- `limit`: Maximum results to display (default: 5)
- `threshold`: Minimum similarity threshold (default: 0.7)

## Setup and Configuration

### 1. Environment Variables
Add your OpenAI API key to `.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Database Migration
Run the Prisma migration to add the embeddings table:
```bash
pnpm db:push
pnpm db:generate
```

### 3. Generate Initial Embeddings
Generate embeddings for existing episodes:
```bash
pnpm embeddings:generate
```

This TypeScript script will:
- Find episodes without embeddings
- Process them in batches to respect rate limits
- Add delays to avoid hitting OpenAI API limits
- Continue processing if individual episodes fail

### 4. Ongoing Embedding Generation

For new episodes, embeddings can be generated:

1. **Automatically**: Add embedding generation to your episode import pipeline
2. **Manually**: Use the generation script for specific episodes
3. **On-demand**: The API will attempt to generate embeddings if missing

## Performance Considerations

### Costs
- OpenAI embeddings cost ~$0.0001 per 1K tokens
- Average episode uses ~500-1000 tokens
- Cost per episode: ~$0.00005-0.0001

### Caching
- Embeddings are cached in the database
- Content hashing prevents unnecessary regeneration
- Only regenerates when episode content changes

### Rate Limits
- OpenAI has rate limits on API calls
- Generation script includes delays between requests
- Batch processing handles errors gracefully

## Similarity Thresholds

Recommended similarity thresholds:
- **0.9+**: Nearly identical content (duplicates, follow-ups)
- **0.8-0.89**: Very similar topics and content
- **0.7-0.79**: Related topics with some overlap
- **0.6-0.69**: Loosely related content
- **<0.6**: Not meaningfully related

## Troubleshooting

### No Related Episodes Found
1. Check if embeddings exist for the episode
2. Lower the similarity threshold
3. Verify episode content has enough text
4. Check OpenAI API key configuration

### Generation Failures
1. Verify OpenAI API key is valid
2. Check rate limits and quotas
3. Ensure episode content is accessible
4. Review error logs for specific failures

### Performance Issues
1. Add database indexes on frequently queried fields
2. Consider caching API responses
3. Implement pagination for large result sets
4. Monitor OpenAI API latency

## Future Enhancements

Potential improvements to consider:

1. **Advanced Filtering**: Filter by episode type, date range, or topics
2. **User Preferences**: Personalized recommendations based on listening history
3. **Hybrid Approach**: Combine semantic similarity with collaborative filtering
4. **Real-time Updates**: Automatic embedding generation on content changes
5. **Analytics**: Track which related episodes are most clicked
6. **A/B Testing**: Test different similarity thresholds and algorithms

## Contributing

When contributing to this feature:

1. Run `pnpm check` to verify TypeScript types
2. Test with sample episodes before deploying
3. Monitor OpenAI API usage and costs
4. Update this documentation for any changes
5. Consider backwards compatibility for API changes
6. All code should be written in TypeScript (.ts files)

## Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Vector Similarity Search](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Semantic Search Best Practices](https://www.pinecone.io/learn/what-is-similarity-search/)
- [SvelteKit API Routes](https://kit.svelte.dev/docs/routing#server)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)