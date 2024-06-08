import { Router, Request, Response, NextFunction } from 'express';
import create from './users/create'
const router = Router();


router.use('/users', create);


router.get('/', async (req: Request, res: Response) => {
   res.send("hello");
});


router.get('/instance', async (req: Request, res: Response) => {
    try {
        const ServerInfo = await req.db.checkPerformance({});
        res.status(200).json(ServerInfo);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
});



export default router;