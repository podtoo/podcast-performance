import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { processPlayData, PlayEvent, ProcessedEvent } from '../utils/processing';
import { getToken } from '../db/mongodb';

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

  router.post('/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.params.token;
        const episodeGUID = req.headers.episodeguid as string; // Extract the episodeGUID from the headers
        const exp = parseInt(req.headers.exp as string, 10); // Extract the exp from the headers
        const playData: PlayEvent[] = Array.isArray(req.body) ? req.body : []; // Ensure playData is an array

        if (!req.db) {
            throw new Error('Database connection not available');
        }
        let tokenData
        if(!exp){
         tokenData = await req.db.getToken({ 's': token, 'exp': exp });
        }
        else{
          tokenData = await req.db.getToken({ 's': token });
        }

        if (tokenData) {
            const checkPastListen = await req.db.getPerformanceData({ 'session_id': tokenData._id });

            if (checkPastListen && checkPastListen.length > 0) {
                const pastData = checkPastListen[0]; // Assuming there is only one past data record

                if (pastData['useragent'] === req.headers['user-agent']) {
                    // Combine past listening data with new play data
                    const sanitizedPastData = pastData.data;
                    console.log(`Past Data - ${JSON.stringify(sanitizedPastData)}`);
                    const sanitizedPlayData = playData;
                    console.log(`currently Data - ${JSON.stringify(sanitizedPlayData)}`)
                    // Combine past listening data with new play data
                    const combinedData = sanitizedPastData.concat(sanitizedPlayData);
                    console.log(JSON.stringify(combinedData));
                    const processedData: ProcessedEvent[] = processPlayData(combinedData);
                    

                    // Store combined processedData in your database
                    console.log('Processed Data:', processedData);

                    const updateData = {
                        session_id: tokenData._id,
                        episodeGUID: episodeGUID,
                        useragent: req.headers['user-agent'],
                        data: processedData
                    };

                    const result = await req.db.upsertDocument({ session_id: tokenData._id, episodeGUID: episodeGUID }, updateData);
                    res.json(result);
                } else {
                    res.status(400).json({ error: 'User-agent mismatch' });
                }
            } else {
                const processedData: ProcessedEvent[] = processPlayData(playData);

                // Store processedData in your database
                console.log('Processed Data:', processedData);

                const updateData = {
                    session_id: tokenData._id,
                    episodeGUID: episodeGUID,
                    useragent: req.headers['user-agent'],
                    data: processedData
                };

                const result = await req.db.upsertDocument({ session_id: tokenData._id, episodeGUID: episodeGUID }, updateData);
                res.json(result);
            }
        } else {
          console.log(`Token not found - { 's': ${token}, 'exp': ${exp} }`);
            res.status(404).json({ error: `Token not found - { 's': ${token}, 'exp': ${exp} }` });
        }
    } catch (error) {
      console.log(`${error} - ${JSON.stringify(error)}`);
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
