import { MongoClient, Db, Collection, InsertOneResult, WithId,  } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI as string);

let db: Db;

const connectDB = async (): Promise<void> => {
  await client.connect();
  db = client.db(process.env.MONGODB_DB); // Connect to the specified database
  console.log('MongoDB connected');
};

const insertDocument = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  const collection: Collection = db.collection('episode_performance');
  const result = await collection.insertOne(data);
  return result;
};

const checkEpisodeGUID = async (data: Record<string, any>): Promise<WithId<any> | null> => {
  const collection: Collection = db.collection(process.env.MONGODB_EPISODE_DB as string);
  const result = await collection.findOne(data);
  return result;
};


const getPerformanceData = async (data: Record<string, any>): Promise<WithId<any> | null> => {
    const collection: Collection = db.collection('episode_performance');
    const result = await collection.find(data).toArray();
    return result;
  };

export {
  connectDB,
  insertDocument,
  checkEpisodeGUID,
  getPerformanceData
  // Add other MongoDB functions as needed
};
