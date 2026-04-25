import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGO_URI as string;
if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
  console.log("Connected to MongoDB");
} else {
  console.log("Using existing MongoDB connection");
}

clientPromise = global._mongoClientPromise;
export default clientPromise;