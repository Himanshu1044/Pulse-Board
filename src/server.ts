import "dotenv/config";
import { createServer } from "http";
import { Server } from 'socket.io';
import app from "./app";
import { setupSocket } from "./socket";
import {initializeSocket} from './socketEmitter';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
})
initializeSocket(io)
setupSocket(io);

httpServer.listen(PORT, () => {
  console.log(`PulseBoard server running on port ${PORT}`);
})