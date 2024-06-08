import { Router } from 'express';
import v2Router from './v2/main'; // Import the v2 router from a deeper file structure

const router = Router();

router.use('/v2', v2Router);

export default router;
