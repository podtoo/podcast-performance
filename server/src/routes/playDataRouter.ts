import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { processPlayData, PlayEvent, ProcessedEvent } from '../utils/processing';

const router = Router();

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

export default router;
