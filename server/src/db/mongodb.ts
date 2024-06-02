import { MongoClient, Db, Collection, InsertOneResult, WithId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';

const client = new MongoClient(process.env.MONGODB_URI as string);

let db: Db;
let isSetupDone = false;

const connectDB = async (): Promise<void> => {
  await client.connect();
  db = client.db(process.env.MONGODB_DB); // Connect to the specified database
  console.log('MongoDB connected');
};

const checkPerformanceSettings = async (): Promise<boolean> => {
  const collections = await db.collections();
  const collectionNames = collections.map(col => col.collectionName);
  return collectionNames.includes('podcast_performance_settings');
};

// Middleware to check performance settings
const performanceSettingsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const exists = await checkPerformanceSettings();
  if (!exists) {
      return res.redirect('/setup');
  }else{
    isSetupDone = true;
  }
  next();
};

const checkPerformance = async (data: Record<string, any>): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_settings');
  const result = await collection.findOne(data);
  return result;
};

const settingsInsertDocument = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_settings');
  const result = await collection.insertOne(data);
  return result;
};

const insertUserSalt = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_user_salts');
  const result = await collection.insertOne(data);
  return result;
};


const createUser = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_users');
  const result = await collection.insertOne(data);
  return result;
};

const saveToken = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_token');
  const result = await collection.insertOne(data);
  return result;
};

const getToken = async (data: Record<string, any>): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_token');
  const result = await collection.findOne(data);
  return result;
};

const insertDocument = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('episode_performance');
  const result = await collection.insertOne(data);
  return result;
};

const upsertDocument = async (filter: Record<string, any>, data: Record<string, any>): Promise<any> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('episode_performance');
  const result = await collection.updateOne(filter, { $set: data }, { upsert: true });
  return result;
};

const checkEpisodeGUID = async (data: Record<string, any>): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');

  const collections = (process.env.MONGODB_EPISODE_DB as string).split(',');

  for (const collectionName of collections) {
    const collection: Collection = db.collection(collectionName.trim());
    const result = await collection.findOne(data);
    if (result) {
      return result; // Return the result if found in any collection
    }
  }

  return null; // Return null if not found in any collection
};

const getPerformanceData = async (data: Record<string, any>): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('episode_performance');
  const result = await collection.find(data).toArray();
  return result;
};

export {
  connectDB,
  performanceSettingsMiddleware,
  checkPerformance,
  settingsInsertDocument,
  insertUserSalt,
  createUser,
  saveToken,
  getToken,
  insertDocument,
  upsertDocument,
  checkEpisodeGUID,
  getPerformanceData
  // Add other MongoDB functions as needed
};
