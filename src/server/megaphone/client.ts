interface MegaphoneEpisode {
	id: string;
	title: string;
	spotifyIdentifier?: string;
	downloadUrl: string;
	pubdate: string; // ISO date string
	// Add other fields as needed
}

interface EpisodeQueryParams {
	page?: number;
	per_page?: number;
	updated_since?: string;
}

interface MegaphonePagination {
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}

interface CacheEntry {
	data: MegaphoneEpisode[];
	timestamp: number;
	params: string; // Serialized params for cache key
}

// Module-level cache shared across all instances
const episode_cache: Map<string, CacheEntry> = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

class MegaphoneApiClient {
	private baseUrl = 'https://cms.megaphone.fm/api';
	private token: string;

	constructor(token: string) {
		this.token = token;
	}

	private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
		const url = new URL(`${this.baseUrl}${endpoint}`);

		// Add query parameters if provided
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value) {
					url.searchParams.append(key, value);
				}
			});
		}

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${this.token}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const error_body = await response.text();
			throw new Error(
				`Megaphone API error: ${response.status} ${response.statusText} - ${error_body}`
			);
		}

		const data = await response.json();

		// Extract pagination info from headers if available
		const pagination = this.extractPaginationFromHeaders(response.headers);

		// For array responses, attach pagination as a property
		if (Array.isArray(data)) {
			Object.defineProperty(data, 'pagination', {
				value: pagination,
				enumerable: false,
				writable: false
			});
		}

		return data as T;
	}

	private extractPaginationFromHeaders(headers: Headers): MegaphonePagination | null {
		const page = headers.get('X-Page');
		const per_page = headers.get('X-Per-Page');
		const total = headers.get('X-Total');

		if (page && per_page && total) {
			return {
				page: parseInt(page),
				per_page: parseInt(per_page),
				total: parseInt(total),
				total_pages: Math.ceil(parseInt(total) / parseInt(per_page))
			};
		}

		return null;
	}

	async getEpisode(episodeId: string): Promise<MegaphoneEpisode> {
		return this.request<MegaphoneEpisode>(`/episodes/${episodeId}`);
	}

	async getEpisodes(
		networkId: string,
		podcastId?: string,
		params?: EpisodeQueryParams
	): Promise<MegaphoneEpisode[]> {
		const endpoint = podcastId
			? `/networks/${networkId}/podcasts/${podcastId}/episodes`
			: `/networks/${networkId}/episodes`;

		// Convert params to string format for URL
		const query_params: Record<string, string> = {};
		if (params) {
			if (params.page) query_params.page = params.page.toString();
			if (params.per_page) query_params.per_page = params.per_page.toString();
			if (params.updated_since) query_params.updated_since = params.updated_since;
		}

		const response = await this.request<MegaphoneEpisode[]>(endpoint, query_params);

		// The API returns an array directly
		if (Array.isArray(response)) {
			return response;
		} else {
			throw new Error(`Unexpected response format from Megaphone API: ${typeof response}`);
		}
	}

	async getAllEpisodes(
		networkId: string,
		podcastId?: string,
		params?: Omit<EpisodeQueryParams, 'page'>
	): Promise<MegaphoneEpisode[]> {
		// Create cache key from parameters
		const cache_key = this.createCacheKey(networkId, podcastId, params);

		// Check cache first
		const cached = this.getFromCache(cache_key);
		if (cached) {
			return cached;
		}

		const all_episodes: MegaphoneEpisode[] = [];
		let current_page = 1;
		const per_page = params?.per_page || 500; // Max per page according to docs

		while (true) {
			const page_params: EpisodeQueryParams = {
				...params,
				page: current_page,
				per_page: per_page
			};

			const response = await this.getEpisodesWithPagination(networkId, podcastId, page_params);

			all_episodes.push(...response.episodes);

			// Check if there are more pages
			if (!response.pagination || current_page >= response.pagination.total_pages) {
				break;
			}

			current_page++;
		}

		// Cache the result
		this.setCache(cache_key, all_episodes);

		return all_episodes;
	}

	private createCacheKey(
		networkId: string,
		podcastId?: string,
		params?: Omit<EpisodeQueryParams, 'page'>
	): string {
		const key = {
			networkId,
			podcastId: podcastId || '',
			params: params || {}
		};
		return JSON.stringify(key);
	}

	private getFromCache(cacheKey: string): MegaphoneEpisode[] | null {
		const entry = episode_cache.get(cacheKey);
		if (!entry) {
			return null;
		}

		// Check if cache entry is still valid
		const now = Date.now();
		if (now - entry.timestamp > CACHE_TIMEOUT) {
			episode_cache.delete(cacheKey);
			return null;
		}

		return entry.data;
	}

	private setCache(cacheKey: string, data: MegaphoneEpisode[]): void {
		episode_cache.set(cacheKey, {
			data,
			timestamp: Date.now(),
			params: cacheKey
		});
	}

	/**
	 * Clear all cached data
	 */
	clearCache(): void {
		episode_cache.clear();
	}

	private async getEpisodesWithPagination(
		networkId: string,
		podcastId?: string,
		params?: EpisodeQueryParams
	): Promise<{ episodes: MegaphoneEpisode[]; pagination: MegaphonePagination | undefined }> {
		const endpoint = podcastId
			? `/networks/${networkId}/podcasts/${podcastId}/episodes`
			: `/networks/${networkId}/episodes`;

		// Convert params to string format for URL
		const query_params: Record<string, string> = {};
		if (params) {
			if (params.page) query_params.page = params.page.toString();
			if (params.per_page) query_params.per_page = params.per_page.toString();
			if (params.updated_since) query_params.updated_since = params.updated_since;
		}

		const response = await this.request<MegaphoneEpisode[]>(endpoint, query_params);

		// The API returns an array directly
		if (Array.isArray(response)) {
			return {
				episodes: response,
				pagination: (response as unknown as { pagination?: MegaphonePagination }).pagination
			};
		} else {
			throw new Error(`Unexpected response format from Megaphone API: ${typeof response}`);
		}
	}
}

// Export class for direct usage
export { MegaphoneApiClient };

export type { MegaphoneEpisode, EpisodeQueryParams };
