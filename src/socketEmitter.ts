import { Server } from "socket.io";

let io: Server;

export const initializeSocket = (server: Server) => {
    io = server;
};

export const emitToProject = (
    projectId: string,
    event: string,
    data: unknown
) => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    io.to(`project:${projectId}`).emit(event, data);
};

export const emitToUser = (
    userId: string,
    event: string,
    data: unknown
) => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    io.to(`user:${userId}`).emit(event, data);
};