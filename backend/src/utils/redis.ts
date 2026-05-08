import Redis from "ioredis";

const host = process.env.REDIS_HOST || "localhost";
const port = Number(process.env.REDIS_PORT || 6379);

export const redis = new Redis({ host, port, maxRetriesPerRequest: null });

export async function cacheGet<T>(key: string): Promise<T | null> {
  const v = await redis.get(key);
  if (v) {
    console.log(`[cache] HIT ${key}`);
    return JSON.parse(v) as T;
  }
  console.log(`[cache] MISS ${key}`);
  return null;
}

export async function cacheSet(key: string, value: unknown, ttl = 60) {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

export async function cacheDelPattern(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}
