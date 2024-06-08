import { Db } from 'mongodb';
import { checkPerformance } from '../../../db/mongodb';

export async function handleStatusCommand(data: any, db: Db): Promise<string> {
  try {
    const serverInfo = await checkPerformance({});
    if (!serverInfo) {
      return 'No server information available';
    }

    return serverInfo

  } catch (error) {
    console.error('Error fetching server status:', error);
    return 'Error fetching server status';
  }
}
