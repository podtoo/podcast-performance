import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/inbox', async (req: Request, res: Response, next: NextFunction) =>{
    res.status(400).send("No access to Inbox as a GET");
})
export default router;