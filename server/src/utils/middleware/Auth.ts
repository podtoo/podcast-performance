import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

import jwt from 'jsonwebtoken';
interface AuthRequest extends Request {
    user?: any; // You can specify the exact type of your user object if known
}


const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
      return res.status(401).json({ error: 'No token provided' });
  }

  const secretKey = process.env.PERFORMANCE_SECRET_KEY;
  if (!secretKey) {
      return res.status(500).json({ error: 'Secret key not configured' });
  }

  jwt.verify(token, secretKey, (err, user) => {
      if (err) {
          if (err.name === 'TokenExpiredError') {
              return res.status(401).json({ error: 'Token has expired' });
          }
          return res.status(403).json({ error: 'Invalid token' });
      }

      req.user = user; // Attach the user payload to the request object
      next();
  });
};

function generateKeys(username: string) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
      },
      privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
      }
  });

  return {
      publicKey,
      secretKey: privateKey,
      publicKeyPem: publicKey
  };
}



  export { authenticateToken , generateKeys};