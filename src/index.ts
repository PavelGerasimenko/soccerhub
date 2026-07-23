import { createServer } from 'http';
import app from './app';
import ChatGateway from './modules/chat/chat.gateway';
import config from './config/environment';
import { closePool } from './config/database';

const PORT = config.server.port;

const httpServer = createServer(app);
const chatGateway = new ChatGateway(httpServer);

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`WebSocket server initialized`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing gracefully...');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing gracefully...');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
});

export default server;
