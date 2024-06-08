import { Server } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { Db } from 'mongodb';

// Extend WebSocket to include an isAlive property
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

async function handleCommand(command: string, data: any, db: Db): Promise<any> {
  try {
    const commandModule = await import(`../websocket/${command}`);
    const handlerFunction = commandModule[`handle${command.charAt(0).toUpperCase() + command.slice(1)}Command`];

    if (handlerFunction) {
      return handlerFunction(data, db);
    } else {
      throw new Error('Command handler not found');
    }
  } catch (error) {
    console.error(`Error handling command: ${command}`, error);
    return { error: `Error handling command: ${command}` };
  }
}

function setupWebSocketServer(server: Server, db: Db): void {
  const wss = new WebSocketServer({
    server,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024,
    },
  });

  console.log('WebSocket server is running');

  wss.on('connection', (ws: WebSocket, req) => {
    const extWs = ws as ExtWebSocket;
    extWs.isAlive = true;

    const clientIp = req.headers['x-real-ip'] || req.socket.remoteAddress;
    console.log(`Client connected from ${clientIp}`);

    extWs.on('pong', () => {
      extWs.isAlive = true;
    });

    extWs.send('Welcome to the WebSocket server behind NGINX!');

    extWs.on('message', async (message: WebSocket.RawData) => {
      console.log(`Received: ${message}`);
      let parsedMessage;

      try {
        const messageString = message.toString();

        // Check if the message is valid JSON
        try {
          parsedMessage = JSON.parse(messageString);
        } catch {
          // Handle plain text commands
          parsedMessage = { command: messageString.trim().toLowerCase().replace(/\s+/g, '') };
        }

        const { command, data } = parsedMessage;

        if (typeof command !== 'string' || (data && typeof data !== 'object')) {
          extWs.send(JSON.stringify({ error: 'Invalid command or data structure' }, null, 2));
          return;
        }

        const response = await handleCommand(command, data, db);
        extWs.send(JSON.stringify({ response }, null, 2));
      } catch (error: unknown) {
        if (error instanceof Error) {
          extWs.send(JSON.stringify({ error: error.message }, null, 2));
        } else {
          extWs.send(JSON.stringify({ error: 'Unknown error occurred' }, null, 2));
        }
      }
    });

    extWs.on('close', () => {
      console.log(`Client from ${clientIp} disconnected`);
    });

    extWs.on('error', (error: Error) => {
      console.error(`WebSocket error for client from ${clientIp}:`, error);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtWebSocket;
      if (!extWs.isAlive) {
        console.log('Terminating inactive client');
        return extWs.terminate();
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('error', (error: Error) => {
    console.error('WebSocket server error:', error);
  });

  wss.on('close', () => {
    console.log('WebSocket server closed');
    clearInterval(interval);
  });
}

export default setupWebSocketServer;
