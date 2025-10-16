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

interface CacheEntry {
	data: MegaphoneEpisode[];
	timestamp: number;
	params: string; // Serialized params for cache key
}

// Module-level cache shared across all instances
const episodeCache: Map<string, CacheEntry> = new Map();
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
			const errorBody = await response.text();
			throw new Error(
				`Megaphone API error: ${response.status} ${response.statusText} - ${errorBody}`
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

	private extractPaginationFromHeaders(headers: Headers): any {
		const page = headers.get('X-Page');
		const perPage = headers.get('X-Per-Page');
		const total = headers.get('X-Total');

		if (page && perPage && total) {
			return {
				page: parseInt(page),
				per_page: parseInt(perPage),
				total: parseInt(total),
				total_pages: Math.ceil(parseInt(total) / parseInt(perPage))
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
		const queryParams: Record<string, string> = {};
		if (params) {
			if (params.page) queryParams.page = params.page.toString();
			if (params.per_page) queryParams.per_page = params.per_page.toString();
			if (params.updated_since) queryParams.updated_since = params.updated_since;
		}

		const response = await this.request<MegaphoneEpisode[]>(endpoint, queryParams);

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
		const cacheKey = this.createCacheKey(networkId, podcastId, params);

		// Check cache first
		const cached = this.getFromCache(cacheKey);
		if (cached) {
			return cached;
		}

		const allEpisodes: MegaphoneEpisode[] = [];
		let currentPage = 1;
		const perPage = params?.per_page || 500; // Max per page according to docs

		while (true) {
			const pageParams: EpisodeQueryParams = {
				...params,
				page: currentPage,
				per_page: perPage
			};

			const response = await this.getEpisodesWithPagination(networkId, podcastId, pageParams);

			allEpisodes.push(...response.episodes);

			// Check if there are more pages
			if (!response.pagination || currentPage >= response.pagination.total_pages) {
				break;
			}

			currentPage++;
		}

		// Cache the result
		this.setCache(cacheKey, allEpisodes);

		return allEpisodes;
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
		const entry = episodeCache.get(cacheKey);
		if (!entry) {
			return null;
		}

		// Check if cache entry is still valid
		const now = Date.now();
		if (now - entry.timestamp > CACHE_TIMEOUT) {
			episodeCache.delete(cacheKey);
			return null;
		}

		return entry.data;
	}

	private setCache(cacheKey: string, data: MegaphoneEpisode[]): void {
		episodeCache.set(cacheKey, {
			data,
			timestamp: Date.now(),
			params: cacheKey
		});
	}

	/**
	 * Clear all cached data
	 */
	clearCache(): void {
		episodeCache.clear();
	}

	private async getEpisodesWithPagination(
		networkId: string,
		podcastId?: string,
		params?: EpisodeQueryParams
	): Promise<{ episodes: MegaphoneEpisode[]; pagination: any }> {
		const endpoint = podcastId
			? `/networks/${networkId}/podcasts/${podcastId}/episodes`
			: `/networks/${networkId}/episodes`;

		// Convert params to string format for URL
		const queryParams: Record<string, string> = {};
		if (params) {
			if (params.page) queryParams.page = params.page.toString();
			if (params.per_page) queryParams.per_page = params.per_page.toString();
			if (params.updated_since) queryParams.updated_since = params.updated_since;
		}

		const response = await this.request<MegaphoneEpisode[]>(endpoint, queryParams);

		// The API returns an array directly
		if (Array.isArray(response)) {
			return {
				episodes: response,
				pagination: (response as any).pagination
			};
		} else {
			throw new Error(`Unexpected response format from Megaphone API: ${typeof response}`);
		}
	}
}

// Export class for direct usage
export { MegaphoneApiClient };

export type { MegaphoneEpisode, EpisodeQueryParams };
