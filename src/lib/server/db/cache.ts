import { Redis } from '@upstash/redis';
import superjson from 'superjson';
import { env } from '$env/dynamic/private';

export type CacheSerializer = {
	serialize: <V>(value: V) => string;
	deserialize: <V>(value: string) => V;
};

export type TTLTime = {
	d?: number;
	h?: number;
	m?: number;
	s?: number;
	ms?: number;
};

type LocalCacheEntry<V> = {
	value: V;
	expiresAt: number;
};

type RedisBackend = {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttlMs?: number): Promise<void>;
	delete(key: string): Promise<number>;
	deleteByPrefix(prefix: string): Promise<number>;
	addToSet(key: string, value: string): Promise<void>;
	getSetMembers(key: string): Promise<string[]>;
};

const defaultSerializer: CacheSerializer = {
	serialize: <V>(value: V) => superjson.stringify(value),
	deserialize: <V>(value: string) => superjson.parse<V>(value)
};

function createUpstashBackend(): RedisBackend {
	const redis = new Redis({
		url: env.UPSTASH_REDIS_REST_URL ?? '',
		token: env.UPSTASH_REDIS_REST_TOKEN ?? '',
		enableTelemetry: false
	});

	return {
		async get(key) {
			return redis.get<string>(key);
		},
		async set(key, value, ttlMs) {
			if (ttlMs !== undefined && ttlMs > 0) {
				await redis.set(key, value, { px: ttlMs });
			} else {
				await redis.set(key, value);
			}
		},
		async delete(key) {
			return redis.del(key);
		},
		async deleteByPrefix(prefix) {
			let cursor = '0';
			let deleted = 0;

			do {
				const [nextCursor, keys] = await redis.scan(cursor, { match: `${prefix}*` });
				if (keys.length > 0) deleted += await redis.del(...keys);
				cursor = nextCursor;
			} while (cursor !== '0');

			return deleted;
		},
		async addToSet(key, value) {
			await redis.sadd(key, value);
		},
		async getSetMembers(key) {
			return redis.smembers<string[]>(key);
		}
	};
}

async function createDevelopmentBackend(): Promise<RedisBackend> {
	const { createClient } = await import('redis');
	const redis = createClient({
		url: env.REDIS_URL,
		disableOfflineQueue: true
	});

	redis.on('error', (error) => {
		console.error('[Redis] Client error:', error);
	});
	await redis.connect();

	return {
		async get(key) {
			return redis.get(key);
		},
		async set(key, value, ttlMs) {
			if (ttlMs !== undefined && ttlMs > 0) {
				await redis.set(key, value, { PX: ttlMs });
			} else {
				await redis.set(key, value);
			}
		},
		async delete(key) {
			return redis.del(key);
		},
		async deleteByPrefix(prefix) {
			let deleted = 0;

			for await (const keys of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
				if (keys.length > 0) deleted += await redis.del(keys);
			}

			return deleted;
		},
		async addToSet(key, value) {
			await redis.sAdd(key, value);
		},
		async getSetMembers(key) {
			return redis.sMembers(key);
		}
	};
}

export class RedisCache {
	private readonly serializer = defaultSerializer;
	private readonly localCache = new Map<string, LocalCacheEntry<unknown>>();
	private readonly defaultLocalCacheDuration: TTLTime = { h: 1 };
	private readonly maxLocalCacheEntries = 100;
	private readonly pendingFetches = new Map<string, Promise<unknown>>();
	private readonly backendPromise: Promise<RedisBackend>;

	constructor() {
		// HACK: use local redis db for development to reduce cost
		this.backendPromise =
			env.NODE_ENV === 'development'
				? createDevelopmentBackend()
				: Promise.resolve(createUpstashBackend());
	}

	private getLocal<V>(key: string): V | null {
		const entry = this.localCache.get(key);
		if (!entry) return null;

		if (entry.expiresAt <= Date.now()) {
			this.localCache.delete(key);
			return null;
		}

		this.localCache.delete(key);
		this.localCache.set(key, entry);
		return entry.value as V;
	}

	private setLocal<V>(key: string, value: V, ttl?: TTLTime): void {
		const ttlMs = RedisCache.getTTL(ttl) ?? RedisCache.getTTL(this.defaultLocalCacheDuration)!;
		if (ttlMs <= 0) return;

		this.localCache.delete(key);
		if (this.localCache.size >= this.maxLocalCacheEntries) {
			const leastRecentlyUsedKey = this.localCache.keys().next().value;
			if (leastRecentlyUsedKey !== undefined) this.localCache.delete(leastRecentlyUsedKey);
		}

		this.localCache.set(key, { value, expiresAt: Date.now() + ttlMs });
	}

	private async getInternal<V>(key: string): Promise<V | null> {
		const localValue = this.getLocal<V>(key);
		if (localValue !== null) return localValue;

		try {
			const result = await (await this.backendPromise).get(key);
			if (result === null) return null;

			const value = this.serializer.deserialize<V>(result);
			this.setLocal(key, value);
			return value;
		} catch (error) {
			console.error('[Redis] Get failed:', error);
			return null;
		}
	}

	private async setInternal<V>(key: string, value: V, ttl?: TTLTime): Promise<boolean> {
		try {
			const ttlMs = RedisCache.getTTL(ttl);
			await (await this.backendPromise).set(key, this.serializer.serialize(value), ttlMs);
			this.setLocal(key, value, ttl);
			return true;
		} catch (error) {
			console.error('[Redis] Set failed:', error);
			return false;
		}
	}

	private async deleteInternal(key: string): Promise<number> {
		this.localCache.delete(key);
		return (await this.backendPromise).delete(key);
	}

	private async fetchWithDedup<V>(
		key: string,
		get: () => Promise<V | null>,
		callback: () => Promise<V>,
		set: (value: V) => Promise<boolean>
	): Promise<V> {
		const cached = await get();
		if (cached !== null) return cached;

		const pending = this.pendingFetches.get(key);
		if (pending) return pending as Promise<V>;

		const promise = (async () => {
			try {
				const data = await callback();
				await set(data);
				return data;
			} finally {
				this.pendingFetches.delete(key);
			}
		})();
		this.pendingFetches.set(key, promise);
		return promise;
	}

	async get<V>(key: string): Promise<V | null> {
		return this.getInternal(key);
	}

	async set<V>(key: string, value: V, ttl?: TTLTime): Promise<boolean> {
		return this.setInternal(key, value, ttl);
	}

	async delete(key: string): Promise<number> {
		return this.deleteInternal(key);
	}

	async deleteByPrefix(prefix: string): Promise<number> {
		for (const key of this.localCache.keys()) {
			if (key.startsWith(prefix)) this.localCache.delete(key);
		}

		return (await this.backendPromise).deleteByPrefix(prefix);
	}

	async fetch<V>(key: string, callback: () => Promise<V>, ttl?: TTLTime): Promise<V> {
		return this.fetchWithDedup(
			key,
			() => this.get<V>(key),
			callback,
			(value) => this.set(key, value, ttl)
		);
	}

	async addToSet(key: string, value: string): Promise<void> {
		await (await this.backendPromise).addToSet(key, value);
	}

	async getSetMembers(key: string): Promise<string[]> {
		return (await this.backendPromise).getSetMembers(key);
	}

	static getTTL(time?: TTLTime): number | undefined {
		if (!time) return undefined;
		return (
			(time.d ?? 0) * 86400000 +
			(time.h ?? 0) * 3600000 +
			(time.m ?? 0) * 60000 +
			(time.s ?? 0) * 1000 +
			(time.ms ?? 0)
		);
	}
}

const globalCache = globalThis as typeof globalThis & {
	__powerRedisCache?: RedisCache;
};

export const cache = (globalCache.__powerRedisCache ??= new RedisCache());
