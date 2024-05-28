import { Db } from 'mongodb';

declare global {
  namespace Express {
    interface Request {
      db?: any;
      dbType?: string;
    }
  }
}
