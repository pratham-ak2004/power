/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// SOURCE: https://github.com/mohxmd/drizzle-redis-cache/blob/main/src/ioredis.ts
// LICENSE (MIT): https://github.com/mohxmd/drizzle-redis-cache/blob/main/LICENSE
import { getTableName, Table } from 'drizzle-orm';
import { Cache } from 'drizzle-orm/cache/core';
import type { CacheConfig } from 'drizzle-orm/cache/core/types';
import { addCacheKeyToTable, deleteCache, getCache, getCacheKeysForTable, setCache } from './cache';

export interface DrizzleCacheOptions {
	/** Redis connection URL. Falls back to REDIS_URL env var. */
	url?: string;
	/** Default TTL in seconds. Default: 300 (5 minutes). */
	defaultTtl?: number;
	/** Key prefix for table tracking Sets. Default: "drizzle:tbl". */
	prefix?: string;
	/** Caching strategy. "all" caches every query, "explicit" requires opt-in. Default: "all". */
	strategy?: 'explicit' | 'all';
}

export class DrizzleCache extends Cache {
	private readonly defaultTtl: number;
	private readonly prefix: string;
	private readonly _strategy: 'explicit' | 'all';

	constructor(options: DrizzleCacheOptions = {}) {
		super();

		this.defaultTtl = options.defaultTtl ?? 300;
		this.prefix = options.prefix ?? 'drizzle:tbl';
		this._strategy = options.strategy ?? 'all';
	}

	override strategy(): 'explicit' | 'all' {
		return this._strategy;
	}

	override async get(
		key: string,
		_tables: string[],
		_isTag: boolean,
		_isAutoInvalidate?: boolean
	): Promise<any[] | undefined> {
		try {
			return (await getCache<any[]>(key)) ?? undefined;
		} catch (error) {
			console.error('[drizzle-redis-cache] get failed:', error);
			return undefined;
		}
	}

	override async put(
		key: string,
		response: any,
		tables: string[],
		_isTag: boolean,
		config?: CacheConfig
	): Promise<void> {
		try {
			const ttl = this.calculateTtl(config);
			await setCache(key, response, ttl);

			for (const table of tables) {
				await addCacheKeyToTable(this.tableKey(table), key);
			}
		} catch (error) {
			console.error('[drizzle-redis-cache] put failed:', error);
		}
	}

	override async onMutate(params: {
		tags?: string | string[];
		tables?: string | string[] | Table<any> | Table<any>[];
	}): Promise<void> {
		try {
			const tags = this.normalizeToArray(params.tags);
			const tables = this.normalizeToArray(params.tables);

			const keysToDelete = new Set<string>(tags);

			for (const table of tables) {
				const setKey = this.tableKey(table);
				const keys = await getCacheKeysForTable(setKey);

				for (const key of keys) {
					keysToDelete.add(key);
				}
				if (keys.length > 0) keysToDelete.add(setKey);
			}

			await Promise.all([...keysToDelete].map((key) => deleteCache(key)));
		} catch (error) {
			console.error('[drizzle-redis-cache] invalidation failed:', error);
		}
	}

	private tableKey(table: string): string {
		return `${this.prefix}:${table}`;
	}

	private normalizeToArray(input?: string | string[] | Table<any> | Table<any>[]): string[] {
		if (!input) return [];
		if (Array.isArray(input)) {
			return input.map((item) => (typeof item === 'string' ? item : getTableName(item)));
		}
		return [typeof input === 'string' ? input : getTableName(input)];
	}

	private calculateTtl(config?: CacheConfig): number {
		if (config?.ex !== undefined) return this.validateTtl(config.ex);
		if (config?.px !== undefined) return this.validateTtl(Math.floor(config.px / 1000));
		if (config?.exat !== undefined) {
			return this.validateTtl(config.exat - Math.floor(Date.now() / 1000));
		}
		if (config?.pxat !== undefined) {
			return this.validateTtl(Math.floor(config.pxat / 1000) - Math.floor(Date.now() / 1000));
		}
		return this.validateTtl(this.defaultTtl);
	}

	private validateTtl(ttl: number): number {
		if (!Number.isSafeInteger(ttl) || ttl <= 0) {
			throw new Error('TTL must be a positive integer number of seconds');
		}
		return ttl;
	}
}
