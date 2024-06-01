import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

type DataItem = {
    time: number;
    event: string;
  };
  
  type EpisodeData = {
    time: number;
    percentage: number;
  };
  
  type Result = {
    guid: string;
    duration:number;
    data: EpisodeData[];
  };


router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract the Bearer token from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      // Ensure req.body is an object with a guid property
      if (typeof req.body !== 'object' || !req.body.guid) {
         return res.status(400).json({ error: 'Invalid request body' });
      }
      
      const body: { guid: string, publickey: string } = req.body;
      
  
      const token = authHeader.split(' ')[1]; // Get the token part after "Bearer "
      
      // Verify and decrypt the JWT token
      const secretKey = process.env.PERFORMANCE_SECRET_KEY as string;
      if (!secretKey) {
        throw new Error('Secret key not defined');
      }
  
      let decoded;
      try {
        decoded = jwt.verify(token, secretKey);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      // Ensure the decoded token has the expected properties
      if (!decoded || typeof decoded !== 'object' || !decoded.s || !decoded.a || !decoded.exp) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }
  
      // Check the database with the decoded token information
      let tokenData;
      try {
        tokenData = await req.db.getToken({ s: decoded.s, a: true, exp: decoded.exp });
        if (!tokenData) {
          return res.status(401).json({ error: 'Token not found in database' });
        }
      } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
  
      // Fetch the episode duration from syndication_episodes collection
      const episode = await req.db.checkEpisodeGUID({ guid:  body.guid });
    
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }
        
      const totalDuration = episode.mediafiles.full_episode.duration; // Assuming duration is in seconds
        
      // Fetch the data related to the episode
      const dataRecords = await req.db.getPerformanceData({ "episodeGUID": body.guid })
      if (dataRecords.length === 0) {
        return res.status(404).json({ error: 'No data found for the episode' });
      }
        
      // Flatten the data array
      const data: DataItem[] = dataRecords.flatMap((record:any )=> record.data);
        
      // Calculate counts
      const countMap: { [key: number]: number } = data.reduce((acc, item) => {
            acc[item.time] = (acc[item.time] || 0) + 1;
              return acc;
            }, {} as { [key: number]: number });
        
      // Find the highest count
      const maxCount = Math.max(...Object.values(countMap));
        
      // Calculate percentages based on the highest count
      const percentages: EpisodeData[] = Object.entries(countMap).map(([time, count]) => ({
                time: Number(time),
                percentage: (count / maxCount) * 100
          }));
        
      const result: Result = {
              guid: body.guid,
              duration: totalDuration,
              data: percentages
            };
        
      res.status(200).json(result);
      
   } catch (error) {
      console.error('Error:', error);
      next(error);
    }
  });

  export default router;
