import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}


export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    return Promise.reject(
      new Error('MONGO_URI is missing. Add it to .env.local and restart the dev server.')
    );
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      // Fail fast when mongod isn't running instead of hanging for 30 seconds.
      serverSelectionTimeoutMS: 5000,
    });

    const pending = client.connect();

    // Forget a rejected attempt so the next request reconnects, and keep the
    // rejection handled so Node doesn't treat it as an unhandled rejection.
    pending.catch((err) => {
      console.error('MongoDB connection failed:', err?.message ?? err);
      if (global._mongoClientPromise === pending) {
        global._mongoClientPromise = undefined;
      }
    });

    global._mongoClientPromise = pending;
  }

  return global._mongoClientPromise;
}

export default getMongoClient;
