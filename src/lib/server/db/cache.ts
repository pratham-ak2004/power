import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

export const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL ?? '',
	token: env.UPSTASH_REDIS_REST_TOKEN ?? '',
	enableTelemetry: false
});

const DEFAULT_TTL_SECONDS = 10 * 60;

export async function getCache<T>(key: string): Promise<T | null> {
	return await redis.get<T>(key);
}

export async function setCache<T>(
	key: string,
	value: T,
	ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<T> {
	if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
		throw new Error('TTL must be a positive number of seconds');
	}

	await redis.set(key, value, {
		ex: ttlSeconds
	});
	return value;
}

export async function deleteCache(key: string): Promise<void> {
	await redis.del(key);
}

export async function addCacheKeyToTable(table: string, key: string): Promise<void> {
	await redis.sadd(table, key);
}

export async function getCacheKeysForTable(table: string): Promise<string[]> {
	return await redis.smembers<string[]>(table);
}
