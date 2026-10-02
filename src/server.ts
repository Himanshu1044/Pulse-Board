import "dotenv/config";
import { createServer } from "http";
import { Server } from 'socket.io';
import app from "./app";
import { setupSocket } from "./socket";
import { initializeSocket } from './socketEmitter';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }
})
initializeSocket(io)
setupSocket(io);

httpServer.listen(PORT, () => {
  console.log(`PulseBoard server running on port ${PORT}`);
})

if (process.env.RUN_EMAIL_WORKER === "true") {
  import("./workers/emailWorker.js").catch((error) => {
    console.error("Failed to start email worker:", error);
  });
}