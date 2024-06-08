import { Router, Request, Response, NextFunction } from 'express';
import { getCurrentTimeInTimezone } from '../../../../utils/middleware/Server'; // Adjust the path to the location of your Auth.ts file
import { authenticateToken, generateKeys } from '../../../../utils/middleware/Auth'; // Adjust the path to the location of your Auth.ts file


interface AuthRequest extends Request {
    user?: any; // Ensure this matches the definition in Auth.ts
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
   res.send("hello");
});




router.post('/create', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user.a !== true) {
            return res.status(400).json({ error: 'Admin token not sent to server.' });
        }

        const serverInfo = await req.db.checkPerformance({});
        const checkToken = await req.db.getToken(req.user);

        const { name, username, email } = req.body;

        // Check if all required fields are provided
        if (!name || !username || !email) {
            return res.status(400).json({ error: 'Name, username, email, and timezone are required' });
        }

        // Check if the username already exists
        const findUser = await req.db.findUser({
            $or: [
                { username },
                { email }
            ]
        });

        if (findUser) {
            return res.status(409).json({ error: 'User with this username or email already exists' });
        }
        

        // Get the current time in the specified timezone
        const currentTime = getCurrentTimeInTimezone(serverInfo.timezone);
        // Generate public and secret keys
        const { publicKey, secretKey, publicKeyPem } = generateKeys(username);

        // User creation logic
        const userData = {
            name,
            username,
            email,
            type:"user",
            createdAt: currentTime, // Use the current time in the specified timezone as createdAt
            publicKey: {
                id: `https://podcastperformance.com/users/${username}#main-key`,
                owner: `https://podcastperformance.com/users/${username}`,
                publicKeyPem
            },
            secretKey,
        };

        const newUser = await req.db.createUser(userData);

        res.status(201).json({ message: 'User created successfully', user_id: newUser._id, 'body.name': name, currentTime });

    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Error creating user' });
    }
});

export default router;