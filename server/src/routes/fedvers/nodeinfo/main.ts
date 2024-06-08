import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();



router.get('2.0', async (req, res)=>{
    const NodeInfo = `{"version":"2.0","software":{"name":"podcast performance","version":"1.0.3"},"protocols":["activitypub"],"services":{"outbound":[],"inbound":[]},"usage":{"users":{"total":1,"activeMonth":1,"activeHalfyear":1},"localPosts":100},"openRegistrations":false,"metadata":{}}`;
    res.json(NodeInfo)
})


export default router;
