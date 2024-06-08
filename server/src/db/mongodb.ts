import { MongoClient, Db, Collection, InsertOneResult, WithId, ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const client = new MongoClient(process.env.MONGODB_URI as string);

let db: Db;
let isSetupDone = false;
interface SignatureResult {
  signature: string;
  date: string;
  digest: string;
}



// Define the fields that should be excluded from the results
const excludedFields = {
  _id: 0,
  smtp: 0,
  sendgridApiKey: 0,
  mailServer: 0,
  mailUsername: 0,
  mailPassword: 0
};

const excludedUserFields = {
  password: 0,
  email: 0,
  secretKey: 0
};

const excludedUserKeyFields = {
  secretKey: 1
};

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
  // Check if the input data is not an empty object
  if (Object.keys(data).length !== 0) {
    throw new Error('Invalid input data: Only an empty object is allowed');
  }
  const collection: Collection = db.collection('podcast_performance_settings');
  const result = await collection.findOne(data,  { projection: excludedFields });
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


const generateSignature = async (data: any, path: string, method: string, host: string): Promise<SignatureResult> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_users');
  const user = await collection.findOne({'username':'russell'}, { projection: excludedUserKeyFields });
  if (!user) {
    throw Error('No User');
  }
  const privateKey = user.secretKey;

  // Generate the digest of the body
  const digest = crypto.createHash('sha256').update(JSON.stringify(data)).digest('base64');

  // Construct the signing string
  const date = new Date().toUTCString();
  const signingString = `(request-target): ${method.toLowerCase()} ${path}\n` +
    `host: ${host}\n` +
    `date: ${date}\n` +
    `digest: SHA-256=${digest}`;

  // Create a sign object and sign the string
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingString);
  sign.end();

  // Generate the signature using the private key
  const signature = sign.sign(privateKey, 'base64');

  return {
    signature,
    date,
    digest
  };
}

const findUser = async (data: Record<string, any>): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_users');
  const result = await collection.findOne(data, { projection: excludedUserFields });
  return result;
};

const followUser = async (username: string, followerUrl: any): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');

  
  
  // Find the user by ID and project excluded fields
  const user = await db.collection('podcast_performance_users').findOne({ username: username }, { projection: excludedUserFields });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if the follower URL is already in the followers array
  if (!user.followers.includes(followerUrl)) {
    // Update the user document to add the follower URL to the followers array
    await db.collection('podcast_performance_users').updateOne(
      { _id: new ObjectId(user._id) },
      { 
        $push: { 'followers': followerUrl } 
      }
    );
    console.log('Follower added successfully');
  } else {
    console.log('Follower already exists in the list');
  }

  // Return the updated user document
  const updatedUser = await db.collection('podcast_performance_users').findOne({ _id: new ObjectId(user._id) }, { projection: excludedUserFields });
  return updatedUser;
};

const unFollowUser = async (username: string, followerUrl: any): Promise<WithId<any> | null> => {
  if (!db) throw new Error('Database not initialized');

  
  
  // Find the user by ID and project excluded fields
  const user = await db.collection('podcast_performance_users').findOne({ username: username }, { projection: excludedUserFields });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if the follower URL is already in the followers array
  if (user.followers.includes(followerUrl)) {
    // Update the user document to add the follower URL to the followers array
    await db.collection('podcast_performance_users').updateOne(
      { _id: new ObjectId(user._id) },
      { 
        $pull: { 'followers': followerUrl } 
      }
    );
    console.log('Follower removed successfully');
  } else {
    console.log('Follower does not exists in the list');
  }

  // Return the updated user document
  const updatedUser = await db.collection('podcast_performance_users').findOne({ _id: new ObjectId(user._id) }, { projection: excludedUserFields });
  return updatedUser;
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

/* ACTIVITY PUB */
const insertActivity = async (data: Record<string, any>): Promise<InsertOneResult<WithId<any>>> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_activity_note');
  const result = await collection.insertOne(data);
  return result;
};

const updateActivity = async (filter: Record<string, any>, data: Record<string, any>): Promise<any> => {
  if (!db) throw new Error('Database not initialized');
  const collection: Collection = db.collection('podcast_performance_activity_note');
  const result = await collection.updateOne(filter, { $set: data }, { upsert: true });
  return result;
};


export {
  connectDB,
  performanceSettingsMiddleware,
  checkPerformance,
  settingsInsertDocument,
  insertUserSalt,
  createUser,
  findUser,
  generateSignature,
  followUser,
  unFollowUser,
  saveToken,
  getToken,
  insertDocument,
  upsertDocument,
  checkEpisodeGUID,
  getPerformanceData,
  insertActivity,
  updateActivity
  // Add other MongoDB functions as needed
};
