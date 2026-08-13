import { createClient } from "redis";

/*
  Redis is a cache, so losing it should cost us speed and nothing else.

  Two failure modes are handled here. The obvious one: this used to call
  `await redis.connect()` at module scope, so if Redis wasn't running the *import*
  rejected and every server action importing this file died before its own error
  handling could run.

  The subtler one: the client's default reconnect strategy retries forever, so a
  dead Redis didn't throw - it just never answered, and the request hung. Every
  call here is bounded by a timeout, the client gives up instead of retrying, and
  a failed connection puts us in a short cooldown so we don't pay the timeout on
  every single request while Redis is down.
*/

type Client = ReturnType<typeof createClient>;

const CONNECT_TIMEOUT_MS = 2000;
const COMMAND_TIMEOUT_MS = 1000;
const RETRY_COOLDOWN_MS = 30_000;

let clientPromise: Promise<Client | null> | null = null;
let skipUntil = 0;

// Nothing in this file is allowed to outlive its timeout.
function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    work.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

function giveUp(client: Client) {
  try {
    client.destroy();
  } catch {
    // Already gone - nothing to clean up.
  }
}

function connect(): Promise<Client | null> {
  // Redis was down recently, so don't even try until the cooldown expires.
  if (Date.now() < skipUntil) return Promise.resolve(null);
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
        // Default is to retry forever, which turns "Redis is down" into
        // "the page never loads". One attempt, then we fall through to Mongo.
        reconnectStrategy: false,
      },
    });

    // Without a listener, an emitted 'error' becomes an uncaught exception.
    client.on("error", (err: any) => {
      console.error("Redis error:", err?.message ?? err);
    });

    try {
      await withTimeout(client.connect(), CONNECT_TIMEOUT_MS, "Redis connect");
      return client;
    } catch (err: any) {
      console.error("Redis unavailable, running without cache:", err?.message ?? err);
      giveUp(client);
      clientPromise = null;
      skipUntil = Date.now() + RETRY_COOLDOWN_MS;
      return null;
    }
  })();

  return clientPromise;
}

export const redis = {
  async get(key: string): Promise<string | null> {
    try {
      const client = await connect();
      if (!client) return null;
      return await withTimeout(client.get(key), COMMAND_TIMEOUT_MS, "Redis get");
    } catch (err: any) {
      console.error("Redis get failed, treating as a cache miss:", err?.message ?? err);
      return null;
    }
  },

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    try {
      const client = await connect();
      if (!client) return;
      await withTimeout(client.set(key, value, options), COMMAND_TIMEOUT_MS, "Redis set");
    } catch (err: any) {
      console.error("Redis set failed, skipping cache write:", err?.message ?? err);
    }
  },
};
