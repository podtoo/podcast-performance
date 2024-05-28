import { MongoClient, Db, Collection, InsertOneResult } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI as string);

let db: Db;

const connectDB = async (): Promise<void> => {
  await client.connect();
  db = client.db(process.env.MONGODB_DB); // Connect to the specified database
  console.log('MongoDB connected');
};

const insertDocument = async (data: Record<string, any>): Promise<InsertOneResult<any>> => {
  const collection: Collection = db.collection('episode_performance');
  const result = await collection.insertOne(data);
  return result;
};

export {
  connectDB,
  insertDocument,
  // Add other MongoDB functions as needed
};
