import express from 'express';
import dotenv from 'dotenv';
import playDataRouter from './routes/playDataRouter';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

let db: any;

const dbType = process.env.DB_TYPE;

if (dbType === 'mongodb') {
  db = require('./db/mongodb');
  db.connectDB();
} else {
  console.error('No valid database type specified');
}


// Read the current version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// Middleware to hash IP addresses
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  if (req.headers['x-real-ip']) {
    req.headers['x-real-ip'] = hashIp(req.headers['x-real-ip'] as string, userAgent);
  }
  if (req.headers['x-forwarded-for']) {
    req.headers['x-forwarded-for'] = hashIp(req.headers['x-forwarded-for'] as string, userAgent);
  }
  next();
});

const hashIp = (ip: string, userAgent: string) => {
  const hash = crypto.createHash('sha256');
  hash.update(ip + userAgent);
  return hash.digest('hex');
};

// Middleware to attach the db connection to the request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Use the playDataRouter for /episodeperformance endpoint
app.use('/episodeperformance', playDataRouter);

// Define other routes
app.get('/', async (req, res) => {



  res.send(`Hello, world! Current version: ${currentVersion}.`);
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'An unknown error occurred' });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
