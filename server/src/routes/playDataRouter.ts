import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { processPlayData, PlayEvent, ProcessedEvent } from '../utils/processing';

const router = Router();

type DataItem = {
    current: number;
    event: string;
  };
  
  type EpisodeData = {
    current: number;
    percentage: number;
  };
  
  type Result = {
    guid: string;
    duration:number;
    data: EpisodeData[];
  };

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const episodeGUID = req.headers.episodeguid as string; // Extract the episodeGUID from the headers
        const playData: PlayEvent[] = req.body;
        const processedData: ProcessedEvent[] = processPlayData(playData);

        // Store processedData in your database
        console.log('Processed Data:', processedData);

        const insertData = {
            headers: req.headers,
            data: processedData
        };

        if (!req.db) {
            throw new Error('Database connection not available');
        }

        if (req.dbType === 'mysql') {
            req.db.insertDocument(insertData, (error: Error, results: any) => {
                if (error) {
                    return next(error);
                }
                res.json(results);
            });
        } else {
            const result = await req.db.insertDocument(insertData);
            res.json(result);
        }
    } catch (error) {
        next(error);
    }
});


router.get('/:episodeID', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const episodeID = req.params.episodeID; // Access the episodeID from req.params
        
        // Fetch the episode duration from syndication_episodes collection
        const episode = await req.db.checkEpisodeGUID({ guid: episodeID });
  
        if (!episode) {
          return res.status(404).json({ error: 'Episode not found' });
        }
  
        const totalDuration = episode.mediafiles.full_episode.duration; // Assuming duration is in seconds
  
        // Fetch the data related to the episode
        const dataRecords = await req.db.getPerformanceData({ "headers.episodeguid": episodeID })
        if (dataRecords.length === 0) {
          return res.status(404).json({ error: 'No data found for the episode' });
        }
  
        // Flatten the data array
        const data: DataItem[] = dataRecords.flatMap((record:any )=> record.data);
  
        // Calculate counts
        const countMap: { [key: number]: number } = data.reduce((acc, item) => {
          acc[item.current] = (acc[item.current] || 0) + 1;
          return acc;
        }, {} as { [key: number]: number });
  
        // Find the highest count
        const maxCount = Math.max(...Object.values(countMap));
  
        // Calculate percentages based on the highest count
        const percentages: EpisodeData[] = Object.entries(countMap).map(([current, count]) => ({
          current: Number(current),
          percentage: (count / maxCount) * 100
        }));
  
        const result: Result = {
          guid: episodeID,
          duration: totalDuration,
          data: percentages
        };
  
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
});


export default router;
